package com.nancyimmo.bailleur.security;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Vérifie un jeton d'identité (ID token) émis par Google Identity Services.
 *
 * <p>La vérification est déléguée à l'endpoint public {@code tokeninfo} de Google, qui valide la
 * signature et l'expiration côté Google et renvoie les claims. On contrôle en plus que le jeton a
 * bien été émis pour NOTRE application ({@code aud} == client-id configuré). Cette approche évite
 * d'ajouter les dépendances lourdes de la bibliothèque Google (et les conflits Jackson associés).
 */
@Component
public class GoogleTokenVerifier {

    private static final String TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

    @Value("${app.google.client-id:}")
    private String clientId;

    private final RestClient restClient = RestClient.create();

    /** Compte Google extrait d'un ID token vérifié. */
    public record GoogleAccount(String email, boolean emailVerified, String firstName, String lastName) {
    }

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank();
    }

    public GoogleAccount verify(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Jeton Google manquant.");
        }

        Map<?, ?> info;
        try {
            info = restClient.get()
                    .uri(TOKENINFO_URL + "?id_token={t}", idToken)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Jeton Google invalide ou expiré.");
        }
        if (info == null || info.get("email") == null) {
            throw new IllegalArgumentException("Jeton Google invalide.");
        }

        // Le jeton doit avoir été émis pour cette application.
        String aud = str(info.get("aud"));
        if (isConfigured() && !clientId.equals(aud)) {
            throw new IllegalArgumentException("Jeton Google émis pour une autre application.");
        }

        boolean emailVerified = "true".equalsIgnoreCase(str(info.get("email_verified")));
        String email = str(info.get("email")).trim().toLowerCase();

        String firstName = str(info.get("given_name"));
        String lastName = str(info.get("family_name"));
        if (firstName.isBlank()) {
            // Repli sur le nom complet si le prénom n'est pas fourni.
            String fullName = str(info.get("name"));
            firstName = fullName.isBlank() ? "Utilisateur" : fullName;
        }

        return new GoogleAccount(email, emailVerified, firstName, lastName);
    }

    private static String str(Object value) {
        return value == null ? "" : value.toString();
    }
}
