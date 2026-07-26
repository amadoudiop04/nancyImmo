# Relations entre les entites (Nancy Immo)

Ce document explique les relations JPA implementees dans le projet.
(Version alignee sur le code et sur le memoire : 8 entites, Lease -> Tenant en Many-to-One.)

## 1) Property -> Building

### Regle metier
Une property peut appartenir a un building (optionnel : un logement peut exister hors immeuble).

### Cardinalite
- Plusieurs properties peuvent appartenir a un seul building.
- C'est donc une relation Many-to-One depuis Property vers Building.

### Mapping JPA
Dans PropertyModel:
```java
@ManyToOne
@JoinColumn(name = "building_id")
private BuildingModel building;
```

Dans BuildingModel (cote inverse):
```java
@OneToMany(mappedBy = "building")
private List<PropertyModel> properties;
```

### Impact base de donnees
- Colonne de cle etrangere: `building_id`
- Table: `properties`
- Cette colonne pointe vers l'id de `buildings`.

## 2) Property -> Landlord

### Regle metier
Une property appartient a un landlord.

### Cardinalite
- Un landlord peut posseder plusieurs properties.
- C'est une relation Many-to-One depuis Property vers Landlord.

### Mapping JPA
Dans PropertyModel:
```java
@ManyToOne
@JoinColumn(name = "landlord_id")
private LandlordModel landlord;
```

Dans LandlordModel (cote inverse):
```java
@OneToMany(mappedBy = "landlord")
private List<PropertyModel> properties;
```

### Impact base de donnees
- Colonne de cle etrangere: `landlord_id`
- Table: `properties`
- Cette colonne pointe vers l'id de `landlords`.

## 3) Lease -> Property

### Regle metier
Un lease concerne une property, et une property n'a qu'un bail actif.

### Cardinalite actuelle
- Relation One-to-One (1 lease pour 1 property, et inversement).

### Mapping JPA
Dans LeaseModel (cote proprietaire):
```java
@OneToOne
@JoinColumn(name = "property_id", unique = true)
private PropertyModel property;
```

### Impact base de donnees
- Colonne de cle etrangere: `property_id`
- Table: `leases`
- `unique = true` impose qu'une property ne soit liee qu'a un seul lease.

## 4) Lease -> Tenant

### Regle metier
Un lease concerne un tenant ; un meme tenant peut avoir plusieurs baux (successifs).

### Cardinalite actuelle
- Relation Many-to-One depuis Lease vers Tenant (1 tenant pour N leases).

### Mapping JPA
Dans LeaseModel (cote proprietaire):
```java
@ManyToOne
@JoinColumn(name = "tenant_id")
private TenantModel tenant;
```

Dans TenantModel (cote inverse):
```java
@OneToMany(mappedBy = "tenant")
private List<LeaseModel> leases;
```

### Impact base de donnees
- Colonne de cle etrangere: `tenant_id`
- Table: `leases`
- Pas de contrainte d'unicite : plusieurs leases peuvent referencer le meme tenant.

## 5) Tenant -> Landlord (isolation des donnees)

### Regle metier
Chaque fiche locataire appartient a un bailleur : un bailleur ne voit que ses propres locataires.

### Mapping JPA
Dans TenantModel:
```java
@ManyToOne
@JoinColumn(name = "landlord_id")
private LandlordModel landlord;
```

### Impact base de donnees
- Colonne de cle etrangere: `landlord_id`
- Table: `tenants`

## 6) Payment -> Lease

- Un bail genere plusieurs echeances de paiement.
- Relation Many-to-One depuis Payment vers Lease (`payments.lease_id`).

## 7) Application -> Property

- Un logement recoit plusieurs candidatures en ligne.
- Relation Many-to-One depuis Application vers Property (`applications.property_id`).

## 8) Document -> Landlord / Property / Tenant

- Un document (contrat de bail, quittance, justificatif) appartient a un bailleur,
  et peut referencer un bien et/ou un locataire (clefs etrangeres nullables).

### Mapping JPA
Dans DocumentModel:
```java
@ManyToOne
@JoinColumn(name = "landlord_id")
private LandlordModel landlord;

@ManyToOne
@JoinColumn(name = "property_id", nullable = true)
private PropertyModel property;

@ManyToOne
@JoinColumn(name = "tenant_id", nullable = true)
private TenantModel tenant;
```

## Resume global

- `Property` porte les cles etrangeres vers `Building` et `Landlord`.
- `Tenant` porte la cle etrangere vers `Landlord` (isolation par bailleur).
- `Lease` porte les cles etrangeres vers `Property` (unique) et `Tenant`.
- `Payment` porte la cle etrangere vers `Lease`.
- `Application` porte la cle etrangere vers `Property`.
- `Document` porte les cles etrangeres vers `Landlord`, `Property` (nullable) et `Tenant` (nullable).
- Les cotes avec `mappedBy` sont les cotes inverses (ils ne portent pas la cle etrangere).

## Schema logique simplifie

- Building (1) -> (N) Property
- Landlord (1) -> (N) Property / Building / Tenant / Document
- Property (1) -> (0..1) Lease
- Tenant (1) -> (N) Lease
- Lease (1) -> (N) Payment
- Property (1) -> (N) Application

## Remarque metier importante

L'historique locatif est deja possible cote locataire (un tenant peut cumuler
plusieurs leases successifs). Pour gerer aussi plusieurs baux successifs sur un
meme logement, il faudra passer la relation Lease -> Property de One-to-One a
Many-to-One (suppression de `unique = true`).
