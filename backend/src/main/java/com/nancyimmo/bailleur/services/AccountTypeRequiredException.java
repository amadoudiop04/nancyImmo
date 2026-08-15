package com.nancyimmo.bailleur.services;

/**
 * Levée quand une connexion Google porte sur un email inconnu sans que le type de compte
 * (bailleur ou locataire) ait été précisé : impossible de deviner, c'est à l'utilisateur de choisir.
 *
 * <p>Le contrôleur la traduit en 409 avec {@code requiresRole:true} ; le client rejoue alors le même
 * ID token en y ajoutant le rôle choisi.
 */
public class AccountTypeRequiredException extends RuntimeException {

    private final String email;
    private final String firstName;

    public AccountTypeRequiredException(String email, String firstName) {
        super("Choisissez le type de compte à créer.");
        this.email = email;
        this.firstName = firstName;
    }

    public String getEmail() { return email; }
    public String getFirstName() { return firstName; }
}
