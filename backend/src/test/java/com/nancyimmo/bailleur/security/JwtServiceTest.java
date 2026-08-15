package com.nancyimmo.bailleur.security;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret",
                "cle-de-test-suffisamment-longue-pour-hmac-sha256-32o");
        ReflectionTestUtils.setField(jwtService, "expirationMs", 86_400_000L);
    }

    @Test
    @DisplayName("Le jeton généré permet de retrouver l'email et le rôle")
    void genere_un_jeton_exploitable() {
        String token = jwtService.generateToken("bailleur@nancyimmo.fr", "BAILLEUR");

        assertNotNull(token);
        assertEquals("bailleur@nancyimmo.fr", jwtService.extractEmail(token));
        assertEquals("BAILLEUR", jwtService.extractRole(token));
    }

    @Test
    @DisplayName("Le rôle LOCATAIRE est bien porté par le jeton")
    void porte_le_role_locataire() {
        String token = jwtService.generateToken("locataire@nancyimmo.fr", "LOCATAIRE");
        assertEquals("LOCATAIRE", jwtService.extractRole(token));
    }

    @Test
    @DisplayName("Un jeton est valide pour son propriétaire, invalide pour un autre")
    void valide_uniquement_pour_le_bon_utilisateur() {
        String token = jwtService.generateToken("a@nancyimmo.fr", "BAILLEUR");

        assertTrue(jwtService.isTokenValid(token, "a@nancyimmo.fr"));
        assertFalse(jwtService.isTokenValid(token, "b@nancyimmo.fr"));
    }

    @Test
    @DisplayName("Un jeton falsifié est rejeté")
    void rejette_un_jeton_falsifie() {
        String token = jwtService.generateToken("a@nancyimmo.fr", "BAILLEUR");
        String falsifie = token.substring(0, token.length() - 3) + "abc";

        assertThrows(Exception.class, () -> jwtService.extractEmail(falsifie));
    }

    @Test
    @DisplayName("Un jeton expiré n'est plus valide")
    void rejette_un_jeton_expire() {
        ReflectionTestUtils.setField(jwtService, "expirationMs", -1000L); // déjà expiré
        String token = jwtService.generateToken("a@nancyimmo.fr", "BAILLEUR");

        assertFalse(jwtService.isTokenValid(token, "a@nancyimmo.fr"));
    }
}