package com.nancyimmo.bailleur.controllers;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import com.nancyimmo.bailleur.dto.PropertyDto;
import com.nancyimmo.bailleur.dto.PropertyDetailsDto;
import com.nancyimmo.bailleur.models.PropertyPhotoModel;
import com.nancyimmo.bailleur.services.PropertyService;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @PostMapping()
    public PropertyDto create(@RequestBody PropertyDto dto) {
        return propertyService.create(dto);
    }

    @GetMapping()
    public List<PropertyDto> getAll() {
        return propertyService.findAll();
    }

    @GetMapping("/details")
    public List<PropertyDetailsDto> getAllWithDetails() {
        return propertyService.findAllDetails();
    }

    @GetMapping("/available")
    public List<PropertyDetailsDto> getAvailable() {
        return propertyService.findAvailable();
    }

    @GetMapping("/{id}")
    public PropertyDto getOne(@PathVariable Long id) {
        return propertyService.findById(id);
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<PropertyDetailsDto> getOneWithDetails(@PathVariable Long id) {
        PropertyDetailsDto details = propertyService.findDetailsById(id);
        if (details == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(details);
    }

    @PutMapping("/{id}")
    public PropertyDto update(@PathVariable Long id, @RequestBody PropertyDto dto) {
        return propertyService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        propertyService.delete(id);
    }

    // ─── Photo du bien ────────────────────────────────────────────────────────

    /** Upload de la photo d'un bien (multipart). Remplace la photo existante. */
    @PostMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PropertyDto uploadPhoto(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        return propertyService.uploadPhoto(id, file);
    }

    /** Retire la photo d'un bien. */
    @DeleteMapping("/{id}/photo")
    public PropertyDto deletePhoto(@PathVariable Long id) {
        return propertyService.deletePhoto(id);
    }

    /**
     * Sert la photo d'un bien. Endpoint public : les annonces sont visibles
     * sans compte, et une balise img n'envoie pas l'en-tête Authorization.
     */
    @GetMapping("/{id}/photo")
    public ResponseEntity<Resource> getPhoto(@PathVariable Long id) {
        PropertyPhotoModel photo = propertyService.getPhoto(id);
        String contentType = photo.getContentType() != null ? photo.getContentType() : MediaType.IMAGE_JPEG_VALUE;
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                // L'URL stockée porte un paramètre de version : le contenu d'une URL donnée ne change jamais.
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .body(new ByteArrayResource(photo.getContent()));
    }
}