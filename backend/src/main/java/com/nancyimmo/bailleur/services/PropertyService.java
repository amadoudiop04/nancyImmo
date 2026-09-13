package com.nancyimmo.bailleur.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import com.nancyimmo.bailleur.dto.PropertyDto;
import com.nancyimmo.bailleur.dto.PropertyDetailsDto;
import com.nancyimmo.bailleur.models.BuildingModel;
import com.nancyimmo.bailleur.models.LandlordModel;
import com.nancyimmo.bailleur.models.LeaseModel;
import com.nancyimmo.bailleur.models.PropertyModel;
import com.nancyimmo.bailleur.models.PropertyPhotoModel;
import com.nancyimmo.bailleur.models.TenantModel;
import com.nancyimmo.bailleur.repositories.BuildingRepository;
import com.nancyimmo.bailleur.repositories.DocumentRepository;
import com.nancyimmo.bailleur.repositories.LandlordRepository;
import com.nancyimmo.bailleur.repositories.LeaseRepository;
import com.nancyimmo.bailleur.repositories.PaymentRepository;
import com.nancyimmo.bailleur.repositories.PropertyPhotoRepository;
import com.nancyimmo.bailleur.repositories.PropertyRepository;
import com.nancyimmo.bailleur.security.CurrentUser;

@Service
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final BuildingRepository buildingRepository;
    private final LandlordRepository landlordRepository;
    private final DocumentRepository documentRepository;
    private final LeaseRepository leaseRepository;
    private final PaymentRepository paymentRepository;
    private final PropertyPhotoRepository propertyPhotoRepository;
    private final ImageService imageService;
    private final CurrentUser currentUser;

    public PropertyService(PropertyRepository propertyRepository,
            BuildingRepository buildingRepository,
            LandlordRepository landlordRepository,
            DocumentRepository documentRepository,
            LeaseRepository leaseRepository,
            PaymentRepository paymentRepository,
            PropertyPhotoRepository propertyPhotoRepository,
            ImageService imageService,
            CurrentUser currentUser) {
        this.propertyRepository = propertyRepository;
        this.buildingRepository = buildingRepository;
        this.landlordRepository = landlordRepository;
        this.documentRepository = documentRepository;
        this.leaseRepository = leaseRepository;
        this.paymentRepository = paymentRepository;
        this.propertyPhotoRepository = propertyPhotoRepository;
        this.imageService = imageService;
        this.currentUser = currentUser;
    }

    public PropertyDto create(PropertyDto dto) {
        PropertyModel model = toEntity(dto);
        // Le bien appartient TOUJOURS au bailleur connecté (on ignore tout landlordId du client).
        model.setLandlord(currentUser.requireLandlord());
        if (dto.getBuildingId() != null) {
            // L'immeuble doit appartenir au bailleur connecté.
            buildingRepository.findByIdAndLandlord_Email(dto.getBuildingId(), currentUser.requireEmail())
                    .ifPresent(model::setBuilding);
        }
        return toDto(propertyRepository.save(model));
    }

    public List<PropertyDto> findAll() {
        return propertyRepository.findByLandlord_Email(currentUser.requireEmail())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public PropertyDto findById(Long id) {
        return propertyRepository.findWithDetailsByIdAndLandlord_Email(id, currentUser.requireEmail())
                .map(this::toDto)
                .orElse(null);
    }

    public PropertyDetailsDto findDetailsById(Long id) {
        return propertyRepository.findWithDetailsByIdAndLandlord_Email(id, currentUser.requireEmail())
                .map(this::toDetailsDto)
                .orElse(null);
    }

    /** Biens du bailleur connecté (espace bailleur). */
    public List<PropertyDetailsDto> findAllDetails() {
        return propertyRepository.findAllWithDetailsByLandlord_Email(currentUser.requireEmail())
                .stream()
                .map(this::toDetailsDto)
                .collect(Collectors.toList());
    }

    /** Tous les biens de la plateforme (statistiques publiques de la page d'accueil). */
    public List<PropertyDetailsDto> findAllDetailsGlobal() {
        return propertyRepository.findAllWithDetailsBy()
                .stream()
                .map(this::toDetailsDto)
                .collect(Collectors.toList());
    }

    /** Annonces disponibles : public (recherche), tous bailleurs confondus. */
    public List<PropertyDetailsDto> findAvailable() {
        return propertyRepository.findAllWithDetailsBy().stream()
                .filter(p -> p.getLease() == null)
                .map(this::toDetailsDto)
                .collect(Collectors.toList());
    }

    public PropertyDto update(Long id, PropertyDto dto) {
        // On ne modifie que les biens du bailleur connecté ; on ne change jamais le propriétaire.
        return propertyRepository.findByIdAndLandlord_Email(id, currentUser.requireEmail())
                .map(existing -> {
                    existing.setName(dto.getName());
                    existing.setSize(dto.getSize());
                    existing.setKind(dto.getKind());
                    existing.setLocation(dto.getLocation());
                    existing.setRent(dto.getRent());
                    if (dto.getDescription() != null) {
                        existing.setDescription(dto.getDescription());
                    }
                    if (dto.getImageUrl() != null) {
                        existing.setImageUrl(dto.getImageUrl());
                    }
                    if (dto.getBuildingId() != null) {
                        buildingRepository.findByIdAndLandlord_Email(dto.getBuildingId(), currentUser.requireEmail())
                                .ifPresent(existing::setBuilding);
                    }
                    return toDto(propertyRepository.save(existing));
                })
                .orElse(null);
    }

    @Transactional
    public void delete(Long id) {
        // On ne supprime que les biens du bailleur connecté.
        PropertyModel property = propertyRepository.findByIdAndLandlord_Email(id, currentUser.requireEmail())
                .orElse(null);
        if (property == null) {
            return;
        }
        // Supprime d'abord les enregistrements dépendants pour éviter les violations de clé étrangère.
        documentRepository.deleteAll(documentRepository.findByPropertyId(id));
        propertyPhotoRepository.deleteByPropertyId(id);

        leaseRepository.findByPropertyId(id).ifPresent(lease -> {
            paymentRepository.deleteAll(paymentRepository.findByLeaseId(lease.getId()));
            lease.setProperty(null);
            lease.setTenant(null);
            property.setLease(null);
            leaseRepository.delete(lease);
        });

        propertyRepository.deleteById(id);
    }

    // ─── Photo du bien ────────────────────────────────────────────────────────

    /**
     * Enregistre la photo uploadée pour un bien du bailleur connecté et pointe
     * {@code imageUrl} vers l'endpoint de service de l'image. L'horodatage en
     * paramètre force le rafraîchissement du cache navigateur à chaque remplacement.
     */
    @Transactional
    public PropertyDto uploadPhoto(Long id, MultipartFile file) {
        PropertyModel property = propertyRepository.findByIdAndLandlord_Email(id, currentUser.requireEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bien introuvable."));

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier manquant.");
        }
        if (file.getSize() > ImageService.MAX_UPLOAD_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image trop volumineuse (5 Mo maximum).");
        }
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        if (!ImageService.ALLOWED_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Format non supporté. Formats acceptés : JPEG, PNG, GIF, WebP.");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lecture du fichier impossible.");
        }
        ImageService.Normalized normalized = imageService.normalize(bytes, contentType);

        PropertyPhotoModel photo = propertyPhotoRepository.findByPropertyId(id)
                .orElseGet(PropertyPhotoModel::new);
        photo.setPropertyId(id);
        photo.setContent(normalized.content());
        photo.setContentType(normalized.contentType());
        photo.setFileName(file.getOriginalFilename());
        photo.setUpdatedAt(Instant.now());
        propertyPhotoRepository.save(photo);

        property.setImageUrl("/api/properties/" + id + "/photo?v=" + photo.getUpdatedAt().toEpochMilli());
        return toDto(propertyRepository.save(property));
    }

    /** Retire la photo d'un bien du bailleur connecté. */
    @Transactional
    public PropertyDto deletePhoto(Long id) {
        PropertyModel property = propertyRepository.findByIdAndLandlord_Email(id, currentUser.requireEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bien introuvable."));
        propertyPhotoRepository.deleteByPropertyId(id);
        property.setImageUrl(null);
        return toDto(propertyRepository.save(property));
    }

    /**
     * Photo d'un bien pour affichage. Volontairement sans filtre sur le bailleur :
     * les annonces (page de recherche publique) affichent ces images.
     */
    public PropertyPhotoModel getPhoto(Long id) {
        return propertyPhotoRepository.findByPropertyId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo introuvable."));
    }

    private PropertyDto toDto(PropertyModel model) {
        PropertyDto dto = new PropertyDto(
                model.getId(),
                model.getName(),
                model.getSize(),
                model.getKind(),
                model.getLocation());
        dto.setDescription(model.getDescription());
        dto.setImageUrl(model.getImageUrl());
        dto.setRent(model.getRent());
        dto.setBuildingId(model.getBuilding() != null ? model.getBuilding().getId() : null);
        dto.setLandlordId(model.getLandlord() != null ? model.getLandlord().getId() : null);
        return dto;
    }

    private PropertyModel toEntity(PropertyDto dto) {
        PropertyModel model = new PropertyModel();
        model.setId(dto.getId());
        model.setName(dto.getName());
        model.setSize(dto.getSize());
        model.setKind(dto.getKind());
        model.setLocation(dto.getLocation());
        // La colonne "description" existante est NOT NULL : on garantit une valeur non nulle.
        model.setDescription(dto.getDescription() != null ? dto.getDescription() : "");
        model.setImageUrl(dto.getImageUrl());
        model.setRent(dto.getRent());
        return model;
    }

    /** Mapping public (réutilisé par le portail locataire) d'un bien vers son DTO détaillé. */
    public PropertyDetailsDto toDetailsDto(PropertyModel model) {
        PropertyDetailsDto dto = new PropertyDetailsDto();
        dto.setId(model.getId());
        dto.setName(model.getName());
        dto.setSize(model.getSize());
        dto.setKind(model.getKind());
        dto.setLocation(model.getLocation());
        dto.setDescription(model.getDescription());
        dto.setImageUrl(model.getImageUrl());
        dto.setRent(model.getRent());

        dto.setBuilding(toBuildingInfo(model.getBuilding()));
        dto.setLandlord(toLandlordInfo(model.getLandlord()));

        LeaseModel leaseModel = model.getLease();
        dto.setLease(toLeaseInfo(leaseModel));
        dto.setTenant(leaseModel != null ? toTenantInfo(leaseModel.getTenant()) : null);

        return dto;
    }

    private PropertyDetailsDto.BuildingInfo toBuildingInfo(BuildingModel model) {
        if (model == null) return null;
        PropertyDetailsDto.BuildingInfo dto = new PropertyDetailsDto.BuildingInfo();
        dto.setId(model.getId());
        dto.setName(model.getName());
        dto.setStreet(model.getStreet());
        dto.setCity(model.getCity());
        dto.setZipCode(model.getZipCode());
        dto.setCountry(model.getCountry());
        return dto;
    }

    private PropertyDetailsDto.LandlordInfo toLandlordInfo(LandlordModel model) {
        if (model == null) return null;
        PropertyDetailsDto.LandlordInfo dto = new PropertyDetailsDto.LandlordInfo();
        dto.setId(model.getId());
        dto.setFirstName(model.getFirstName());
        dto.setLastName(model.getLastName());
        dto.setEmail(model.getEmail());
        dto.setPhone(model.getPhone());
        dto.setStreet(model.getStreet());
        dto.setCity(model.getCity());
        dto.setZipCode(model.getZipCode());
        dto.setCountry(model.getCountry());
        return dto;
    }

    private PropertyDetailsDto.LeaseInfo toLeaseInfo(LeaseModel model) {
        if (model == null) return null;
        PropertyDetailsDto.LeaseInfo dto = new PropertyDetailsDto.LeaseInfo();
        dto.setId(model.getId());
        dto.setSignatureDate(model.getSignatureDate());
        dto.setStartDate(model.getStartDate());
        dto.setEndDate(model.getEndDate());
        dto.setRentAmount(model.getRentAmount());
        dto.setCurrency(model.getCurrency());
        return dto;
    }

    private PropertyDetailsDto.TenantInfo toTenantInfo(TenantModel model) {
        if (model == null) return null;
        PropertyDetailsDto.TenantInfo dto = new PropertyDetailsDto.TenantInfo();
        dto.setId(model.getId());
        dto.setFirstName(model.getFirstName());
        dto.setLastName(model.getLastName());
        dto.setEmail(model.getEmail());
        dto.setPhone(model.getPhone());
        dto.setStreet(model.getStreet());
        dto.setCity(model.getCity());
        dto.setZipCode(model.getZipCode());
        dto.setCountry(model.getCountry());
        return dto;
    }
}
