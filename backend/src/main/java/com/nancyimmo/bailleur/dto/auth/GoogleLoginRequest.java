package com.nancyimmo.bailleur.dto.auth;

/**
 * Requête de connexion via Google : porte l'ID token renvoyé par Google Identity Services.
 *
 * <p>{@code role} (BAILLEUR ou LOCATAIRE) n'est utilisé que lorsque l'email Google ne correspond à
 * aucun compte : il décide alors du type de compte à créer. Pour un email déjà connu, le rôle
 * existant prime. S'il est absent sur un email inconnu, l'API répond 409 {@code requiresRole} afin
 * que le client fasse choisir le type de compte.
 */
public class GoogleLoginRequest {
    private String idToken;
    private String role;

    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
