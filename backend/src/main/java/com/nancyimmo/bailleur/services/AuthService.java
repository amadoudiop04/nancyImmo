package com.nancyimmo.bailleur.services;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nancyimmo.bailleur.dto.auth.AuthResponse;
import com.nancyimmo.bailleur.dto.auth.LoginRequest;
import com.nancyimmo.bailleur.dto.auth.RegisterRequest;
import com.nancyimmo.bailleur.models.LandlordModel;
import com.nancyimmo.bailleur.models.PropertyModel;
import com.nancyimmo.bailleur.models.TenantModel;
import com.nancyimmo.bailleur.repositories.ApplicationRepository;
import com.nancyimmo.bailleur.repositories.BuildingRepository;
import com.nancyimmo.bailleur.repositories.DocumentRepository;
import com.nancyimmo.bailleur.repositories.LandlordRepository;
import com.nancyimmo.bailleur.repositories.LeaseRepository;
import com.nancyimmo.bailleur.repositories.PaymentRepository;
import com.nancyimmo.bailleur.repositories.PropertyRepository;
import com.nancyimmo.bailleur.repositories.TenantRepository;
import com.nancyimmo.bailleur.security.GoogleTokenVerifier;
import com.nancyimmo.bailleur.security.JwtService;

@Service
public class AuthService {

    private static final String ROLE = "BAILLEUR";
    private static final String ROLE_TENANT = "LOCATAIRE";
    private static final long RESET_TOKEN_TTL_MINUTES = 30;

    /** BCrypt refuse toute entrée de plus de 72 octets (limite de l'algorithme). */
    private static final int MAX_PASSWORD_BYTES = 72;

    private final LandlordRepository landlordRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PropertyRepository propertyRepository;
    private final TenantRepository tenantRepository;
    private final BuildingRepository buildingRepository;
    private final LeaseRepository leaseRepository;
    private final PaymentRepository paymentRepository;
    private final DocumentRepository documentRepository;
    private final ApplicationRepository applicationRepository;
    private final MailService mailService;
    private final GoogleTokenVerifier googleTokenVerifier;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    public AuthService(LandlordRepository landlordRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            PropertyRepository propertyRepository,
            TenantRepository tenantRepository,
            BuildingRepository buildingRepository,
            LeaseRepository leaseRepository,
            PaymentRepository paymentRepository,
            DocumentRepository documentRepository,
            ApplicationRepository applicationRepository,
            MailService mailService,
            GoogleTokenVerifier googleTokenVerifier) {
        this.landlordRepository = landlordRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.propertyRepository = propertyRepository;
        this.tenantRepository = tenantRepository;
        this.buildingRepository = buildingRepository;
        this.leaseRepository = leaseRepository;
        this.paymentRepository = paymentRepository;
        this.documentRepository = documentRepository;
        this.applicationRepository = applicationRepository;
        this.mailService = mailService;
        this.googleTokenVerifier = googleTokenVerifier;
    }

    public AuthResponse register(RegisterRequest req) {
        if (req.getEmail() == null || req.getPassword() == null
                || req.getFirstName() == null || req.getLastName() == null) {
            throw new IllegalArgumentException("Champs obligatoires manquants.");
        }
        requirePasswordWithinBcryptLimit(req.getPassword());
        String email = req.getEmail().trim().toLowerCase();
        boolean wantsTenant = ROLE_TENANT.equalsIgnoreCase(req.getRole());

        // Un email ne peut pas désigner à la fois un bailleur et un locataire.
        if (landlordRepository.existsByEmail(email)) {
            throw new IllegalStateException("Un compte existe déjà avec cet email.");
        }

        if (wantsTenant) {
            return registerTenant(req, email);
        }

        // Bailleur (par défaut) : le bailleur EST le compte.
        TenantModel collidingTenant = tenantRepository.findByEmail(email).orElse(null);
        if (collidingTenant != null && collidingTenant.getPassword() != null) {
            throw new IllegalStateException("Un compte existe déjà avec cet email.");
        }
        LandlordModel landlord = new LandlordModel();
        landlord.setFirstName(req.getFirstName());
        landlord.setLastName(req.getLastName());
        landlord.setEmail(email);
        landlord.setPassword(passwordEncoder.encode(req.getPassword()));
        landlordRepository.save(landlord);

        String token = jwtService.generateToken(email, ROLE);
        return new AuthResponse(token, email, ROLE, landlord.getFirstName(), landlord.getLastName());
    }

    /**
     * Inscription locataire. Si une fiche locataire existe déjà pour cet email (créée par un
     * bailleur), on l'« active » en lui attribuant un mot de passe — le locataire récupère ainsi
     * l'accès à son bail. Sinon on crée une fiche locataire autonome (sans bien tant qu'un
     * bailleur ne l'a pas rattachée).
     */
    private AuthResponse registerTenant(RegisterRequest req, String email) {
        TenantModel tenant = tenantRepository.findByEmail(email).orElse(null);
        if (tenant != null && tenant.getPassword() != null) {
            throw new IllegalStateException("Un compte existe déjà avec cet email.");
        }
        if (tenant == null) {
            tenant = new TenantModel();
            tenant.setEmail(email);
            tenant.setFirstName(req.getFirstName());
            tenant.setLastName(req.getLastName());
        } else {
            if (tenant.getFirstName() == null || tenant.getFirstName().isBlank()) {
                tenant.setFirstName(req.getFirstName());
            }
            if (tenant.getLastName() == null || tenant.getLastName().isBlank()) {
                tenant.setLastName(req.getLastName());
            }
        }
        tenant.setPassword(passwordEncoder.encode(req.getPassword()));
        tenantRepository.save(tenant);

        String token = jwtService.generateToken(email, ROLE_TENANT);
        return new AuthResponse(token, email, ROLE_TENANT, tenant.getFirstName(), tenant.getLastName());
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.getEmail() == null ? "" : req.getEmail().trim().toLowerCase();
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, req.getPassword()));
        } catch (Exception e) {
            throw new BadCredentialsException("Email ou mot de passe incorrect.");
        }
        return buildAuthResponse(email, true);
    }

    /**
     * Connexion / inscription via Google. On vérifie l'ID token, puis :
     * <ul>
     *   <li>si l'email correspond déjà à un compte (bailleur ou locataire) : connexion avec son rôle ;</li>
     *   <li>si l'email est inconnu : création d'un compte du <strong>type demandé</strong>
     *       ({@code requestedRole} = BAILLEUR ou LOCATAIRE) ;</li>
     *   <li>si l'email est inconnu et qu'aucun type n'est demandé : {@link AccountTypeRequiredException}
     *       — le client fait choisir le type de compte, puis rejoue l'appel avec le rôle.</li>
     * </ul>
     * Un mot de passe aléatoire est posé sur les comptes Google (jamais communiqué) afin que tous
     * les autres flux (/me, etc.) restent cohérents ; l'utilisateur pourra en définir un via
     * « mot de passe oublié » s'il souhaite aussi se connecter par email.
     */
    @Transactional
    public AuthResponse loginWithGoogle(String idToken, String requestedRole) {
        GoogleTokenVerifier.GoogleAccount g = googleTokenVerifier.verify(idToken);
        if (!g.emailVerified()) {
            throw new IllegalStateException("Cet email Google n'est pas vérifié.");
        }
        String email = g.email();
        boolean wantsTenant = ROLE_TENANT.equalsIgnoreCase(requestedRole);
        boolean wantsLandlord = ROLE.equalsIgnoreCase(requestedRole);

        LandlordModel landlord = landlordRepository.findByEmail(email).orElse(null);
        TenantModel tenant = tenantRepository.findByEmail(email).orElse(null);

        // Le type demandé est prioritaire quand une fiche de ce type existe déjà : un locataire créé
        // par son bailleur peut ainsi « activer » sa fiche avec Google même s'il porte les deux rôles.
        if (wantsTenant && tenant != null) {
            return googleSignInTenant(tenant, g);
        }
        if (wantsLandlord && landlord != null) {
            return googleSignInLandlord(landlord);
        }

        // Sinon, on connecte le compte existant quel qu'il soit (bailleur prioritaire).
        if (landlord != null) {
            return googleSignInLandlord(landlord);
        }
        if (tenant != null) {
            return googleSignInTenant(tenant, g);
        }

        // Email inconnu : impossible de deviner le type de compte, l'utilisateur doit le choisir.
        if (!wantsTenant && !wantsLandlord) {
            throw new AccountTypeRequiredException(email, g.firstName());
        }
        return wantsTenant ? googleCreateTenant(g) : googleCreateLandlord(g);
    }

    /** Connecte un bailleur existant via Google (pose un mot de passe si la fiche n'en avait pas). */
    private AuthResponse googleSignInLandlord(LandlordModel landlord) {
        if (landlord.getPassword() == null) {
            landlord.setPassword(randomPassword());
            landlordRepository.save(landlord);
        }
        String email = landlord.getEmail();
        return new AuthResponse(jwtService.generateToken(email, ROLE), email, ROLE,
                landlord.getFirstName(), landlord.getLastName());
    }

    /** Connecte un locataire via Google, en activant sa fiche (mot de passe / nom) si besoin. */
    private AuthResponse googleSignInTenant(TenantModel tenant, GoogleTokenVerifier.GoogleAccount g) {
        if (tenant.getPassword() == null) {
            tenant.setPassword(randomPassword());
        }
        if (tenant.getFirstName() == null || tenant.getFirstName().isBlank()) {
            tenant.setFirstName(g.firstName());
        }
        if (tenant.getLastName() == null || tenant.getLastName().isBlank()) {
            tenant.setLastName(g.lastName());
        }
        tenantRepository.save(tenant);
        String email = tenant.getEmail();
        return new AuthResponse(jwtService.generateToken(email, ROLE_TENANT), email, ROLE_TENANT,
                tenant.getFirstName(), tenant.getLastName());
    }

    /** Crée un compte bailleur à partir d'un compte Google. */
    private AuthResponse googleCreateLandlord(GoogleTokenVerifier.GoogleAccount g) {
        LandlordModel created = new LandlordModel();
        created.setFirstName(g.firstName());
        created.setLastName(g.lastName());
        created.setEmail(g.email());
        created.setPassword(randomPassword());
        landlordRepository.save(created);
        return new AuthResponse(jwtService.generateToken(g.email(), ROLE), g.email(), ROLE,
                created.getFirstName(), created.getLastName());
    }

    /**
     * Crée un compte locataire à partir d'un compte Google. La fiche reste orpheline (sans bien)
     * jusqu'à ce qu'un bailleur la rattache — même comportement que l'inscription par mot de passe.
     */
    private AuthResponse googleCreateTenant(GoogleTokenVerifier.GoogleAccount g) {
        TenantModel created = new TenantModel();
        created.setFirstName(g.firstName());
        created.setLastName(g.lastName());
        created.setEmail(g.email());
        created.setPassword(randomPassword());
        tenantRepository.save(created);
        return new AuthResponse(jwtService.generateToken(g.email(), ROLE_TENANT), g.email(), ROLE_TENANT,
                created.getFirstName(), created.getLastName());
    }

    /**
     * Vérifie que le mot de passe tient dans la limite de BCrypt.
     *
     * <p>La limite porte sur les OCTETS UTF-8, pas sur les caractères : un mot de passe accentué
     * peut faire moins de 72 caractères et dépasser quand même. Sans ce contrôle, BCrypt lève une
     * {@code IllegalArgumentException} technique remontée telle quelle à l'utilisateur.
     */
    private static void requirePasswordWithinBcryptLimit(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new IllegalArgumentException(
                    "Mot de passe trop long (72 octets maximum ; les caractères accentués en comptent 2).");
        }
    }

    /**
     * Mot de passe non devinable pour les comptes Google (jamais transmis au client).
     *
     * <p>Un seul UUID (36 octets, 122 bits d'entropie) : deux UUID concaténés dépassaient d'un
     * octet la limite de 72 imposée par BCrypt, qui rejetait alors toute connexion Google.
     */
    private String randomPassword() {
        return passwordEncoder.encode(UUID.randomUUID().toString());
    }

    /** Construit la réponse d'auth en détectant le rôle (bailleur ou locataire) à partir de l'email. */
    private AuthResponse buildAuthResponse(String email, boolean withToken) {
        LandlordModel landlord = landlordRepository.findByEmail(email).orElse(null);
        if (landlord != null && landlord.getPassword() != null) {
            String token = withToken ? jwtService.generateToken(email, ROLE) : null;
            return new AuthResponse(token, landlord.getEmail(), ROLE, landlord.getFirstName(), landlord.getLastName());
        }
        TenantModel tenant = tenantRepository.findByEmail(email).orElse(null);
        if (tenant != null && tenant.getPassword() != null) {
            String token = withToken ? jwtService.generateToken(email, ROLE_TENANT) : null;
            return new AuthResponse(token, tenant.getEmail(), ROLE_TENANT, tenant.getFirstName(), tenant.getLastName());
        }
        throw new BadCredentialsException("Email ou mot de passe incorrect.");
    }

    /**
     * Demande de réinitialisation : si un compte correspond à l'email, génère un jeton à usage
     * unique (valable 30 min) et envoie un email contenant le lien de réinitialisation. Ne révèle
     * jamais si le compte existe (le contrôleur renvoie toujours un message générique).
     */
    @Transactional
    public void forgotPassword(String rawEmail) {
        String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase();

        LandlordModel landlord = landlordRepository.findByEmail(email).orElse(null);
        if (landlord != null && landlord.getPassword() != null) {
            String token = newResetToken();
            landlord.setResetToken(token);
            landlord.setResetTokenExpiry(Instant.now().plus(RESET_TOKEN_TTL_MINUTES, ChronoUnit.MINUTES));
            landlordRepository.save(landlord);
            mailService.sendPasswordReset(landlord.getEmail(), landlord.getFirstName(), resetLink(token));
            return;
        }

        TenantModel tenant = tenantRepository.findByEmail(email).orElse(null);
        if (tenant != null && tenant.getPassword() != null) {
            String token = newResetToken();
            tenant.setResetToken(token);
            tenant.setResetTokenExpiry(Instant.now().plus(RESET_TOKEN_TTL_MINUTES, ChronoUnit.MINUTES));
            tenantRepository.save(tenant);
            mailService.sendPasswordReset(tenant.getEmail(), tenant.getFirstName(), resetLink(token));
        }
        // Compte inconnu : on ne fait rien (aucune fuite d'information).
    }

    private String newResetToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    /** Construit le lien de réinitialisation pointant vers la page /reset du frontend. */
    private String resetLink(String token) {
        String base = frontendUrl == null ? "" : frontendUrl.replaceAll("/+$", "");
        return base + "/reset?token=" + token;
    }

    /**
     * Réinitialise le mot de passe à partir d'un jeton valide (bailleur OU locataire), puis
     * connecte directement le compte (renvoie un JWT). Le jeton est invalidé après usage.
     */
    @Transactional
    public AuthResponse resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank() || newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Lien invalide ou mot de passe trop court (6 caractères minimum).");
        }
        requirePasswordWithinBcryptLimit(newPassword);

        LandlordModel landlord = landlordRepository.findByResetToken(token).orElse(null);
        if (landlord != null) {
            requireValidExpiry(landlord.getResetTokenExpiry());
            landlord.setPassword(passwordEncoder.encode(newPassword));
            landlord.setResetToken(null);
            landlord.setResetTokenExpiry(null);
            landlordRepository.save(landlord);
            String jwt = jwtService.generateToken(landlord.getEmail(), ROLE);
            return new AuthResponse(jwt, landlord.getEmail(), ROLE, landlord.getFirstName(), landlord.getLastName());
        }

        TenantModel tenant = tenantRepository.findByResetToken(token).orElse(null);
        if (tenant != null) {
            requireValidExpiry(tenant.getResetTokenExpiry());
            tenant.setPassword(passwordEncoder.encode(newPassword));
            tenant.setResetToken(null);
            tenant.setResetTokenExpiry(null);
            tenantRepository.save(tenant);
            String jwt = jwtService.generateToken(tenant.getEmail(), ROLE_TENANT);
            return new AuthResponse(jwt, tenant.getEmail(), ROLE_TENANT, tenant.getFirstName(), tenant.getLastName());
        }

        throw new IllegalArgumentException("Lien de réinitialisation invalide.");
    }

    private void requireValidExpiry(Instant expiry) {
        if (expiry == null || expiry.isBefore(Instant.now())) {
            throw new IllegalArgumentException("Ce lien a expiré. Veuillez refaire une demande.");
        }
    }

    public AuthResponse currentUser(String email) {
        return buildAuthResponse(email, false);
    }

    /**
     * Supprime définitivement le compte du bailleur et TOUTES ses données associées
     * (biens, baux, paiements, documents, candidatures, locataires, immeubles).
     * L'ordre respecte les contraintes de clés étrangères.
     */
    @Transactional
    public void deleteAccount(String email) {
        LandlordModel landlord = landlordRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Compte introuvable."));

        // 1) Documents du bailleur (référencent biens/locataires).
        documentRepository.deleteAll(documentRepository.findByLandlord_EmailOrderByCreatedAtDesc(email));

        // 2) Pour chaque bien : candidatures, puis bail (+ ses paiements).
        List<PropertyModel> properties = propertyRepository.findByLandlord_Email(email);
        for (PropertyModel property : properties) {
            applicationRepository.deleteAll(applicationRepository.findByPropertyId(property.getId()));
            leaseRepository.findByPropertyId(property.getId()).ifPresent(lease -> {
                paymentRepository.deleteAll(paymentRepository.findByLeaseId(lease.getId()));
                lease.setProperty(null);
                lease.setTenant(null);
                property.setLease(null);
                leaseRepository.delete(lease);
            });
        }

        // 3) Biens.
        propertyRepository.deleteAll(properties);

        // 4) Locataires et immeubles du bailleur.
        tenantRepository.deleteAll(tenantRepository.findByLandlord_Email(email));
        buildingRepository.deleteAll(buildingRepository.findByLandlord_Email(email));

        // 5) Le compte lui-même.
        landlordRepository.delete(landlord);
    }
}
