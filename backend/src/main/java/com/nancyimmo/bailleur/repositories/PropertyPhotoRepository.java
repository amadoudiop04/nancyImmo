package com.nancyimmo.bailleur.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nancyimmo.bailleur.models.PropertyPhotoModel;

@Repository
public interface PropertyPhotoRepository extends JpaRepository<PropertyPhotoModel, Long> {

    Optional<PropertyPhotoModel> findByPropertyId(Long propertyId);

    void deleteByPropertyId(Long propertyId);
}
