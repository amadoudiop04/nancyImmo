package com.nancyimmo.bailleur.models;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Photo d'un bien, stockée en base (comme les pièces justificatives).
 *
 * Table séparée et volontairement sans relation JPA vers {@link PropertyModel} :
 * les listes de biens (recherche, tableau de bord, espace locataire) ne chargent
 * ainsi jamais les octets de l'image. Le lien se fait par {@code propertyId}.
 */
@Entity
@Table(name = "property_photos")
public class PropertyPhotoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "property_id", nullable = false, unique = true)
    private Long propertyId;

    @Column(columnDefinition = "bytea")
    private byte[] content;

    private String contentType;
    private String fileName;
    private Instant updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPropertyId() { return propertyId; }
    public void setPropertyId(Long propertyId) { this.propertyId = propertyId; }

    public byte[] getContent() { return content; }
    public void setContent(byte[] content) { this.content = content; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
