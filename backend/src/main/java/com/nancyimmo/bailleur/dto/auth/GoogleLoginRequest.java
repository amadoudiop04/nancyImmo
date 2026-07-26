package com.nancyimmo.bailleur.dto.auth;

/** Requête de connexion via Google : porte l'ID token renvoyé par Google Identity Services. */
public class GoogleLoginRequest {
    private String idToken;

    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }
}
