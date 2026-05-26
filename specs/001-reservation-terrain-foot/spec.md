# Feature Specification: Application de réservation de terrain de foot

**Feature Branch**: `001-reservation-terrain-foot`  
**Created**: 2026-05-26  
**Status**: Draft  
**Input**: User description: "Application de réservation de terrain de foot"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Réserver un créneau (Priority: P1)

Un joueur souhaite réserver un terrain de foot pour une date et un horaire donnés. Il consulte les créneaux disponibles, choisit un terrain et un créneau libre, saisit ses informations, et confirme sa réservation.

**Why this priority**: C'est la fonctionnalité centrale de l'application. Sans elle, rien d'autre n'a de valeur.

**Independent Test**: Peut être testé en ouvrant l'application, en sélectionnant un terrain et un créneau, en renseignant un nom et en validant — la réservation apparaît dans la liste des réservations du jour.

**Acceptance Scenarios**:

1. **Given** la liste des terrains avec leurs créneaux du jour, **When** je sélectionne un créneau libre et je valide avec mon nom, **Then** la réservation est confirmée et le créneau passe à "réservé"
2. **Given** un créneau déjà réservé, **When** je tente de le sélectionner, **Then** le créneau est grisé et non sélectionnable
3. **Given** le formulaire de réservation, **When** je soumets sans renseigner mon nom, **Then** le formulaire signale le champ comme requis et ne valide pas

---

### User Story 2 - Consulter et annuler sa réservation (Priority: P2)

Un joueur qui a réservé un terrain souhaite retrouver sa réservation et, si nécessaire, l'annuler avant l'heure prévue.

**Why this priority**: L'annulation libère des créneaux pour d'autres joueurs et évite les "no-shows", ce qui est essentiel pour la bonne gestion des terrains.

**Independent Test**: Peut être testé en accédant à la vue "Mes réservations" via le code de réservation reçu, puis en annulant une réservation future — le créneau redevient disponible.

**Acceptance Scenarios**:

1. **Given** une réservation existante, **When** j'entre mon code de réservation, **Then** je vois les détails (terrain, date, heure) et un bouton "Annuler"
2. **Given** une réservation future, **When** je clique sur "Annuler" et confirme, **Then** la réservation est supprimée et le créneau redevient libre
3. **Given** une réservation passée, **When** j'accède à ma réservation, **Then** le bouton "Annuler" est absent ou désactivé

---

### User Story 3 - Gérer les terrains et créneaux (Priority: P3)

Un gestionnaire souhaite configurer les terrains disponibles et définir les plages horaires proposées à la réservation.

**Why this priority**: Permet à l'opérateur de l'application d'adapter l'offre à la réalité de son équipement sportif.

**Independent Test**: Peut être testé en accédant à la vue d'administration, en ajoutant un terrain avec ses créneaux — les créneaux apparaissent immédiatement dans la vue publique.

**Acceptance Scenarios**:

1. **Given** la vue d'administration, **When** j'ajoute un terrain avec un nom et une liste de créneaux horaires, **Then** le terrain et ses créneaux sont visibles par les joueurs
2. **Given** un terrain existant, **When** je modifie son nom ou ses créneaux, **Then** les changements sont répercutés immédiatement
3. **Given** un terrain sans réservation active, **When** je le supprime, **Then** il disparaît de la liste publique

---

### Edge Cases

- Que se passe-t-il si deux joueurs tentent de réserver le même créneau en même temps ?
- Comment gérer un créneau dont la date est passée : reste-t-il visible ou est-il masqué ?
- Que se passe-t-il si l'utilisateur ferme la page pendant la réservation ?
- Que faire si tous les créneaux d'une journée sont pris ?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT afficher la liste des terrains disponibles avec leurs créneaux du jour
- **FR-002**: Le système DOIT permettre de naviguer entre les dates (jour précédent / suivant)
- **FR-003**: Le système DOIT distinguer visuellement les créneaux libres, réservés et passés
- **FR-004**: Un joueur DOIT pouvoir réserver un créneau libre en renseignant son nom (et optionnellement son numéro de téléphone)
- **FR-005**: Le système DOIT générer un code de réservation unique à l'issue de chaque réservation
- **FR-006**: Un joueur DOIT pouvoir retrouver et annuler sa réservation via son code unique
- **FR-007**: Le système DOIT empêcher la réservation d'un créneau déjà pris
- **FR-008**: Le système DOIT empêcher la réservation ou l'annulation d'un créneau passé
- **FR-009**: Un gestionnaire DOIT pouvoir ajouter, modifier et supprimer des terrains
- **FR-010**: Un gestionnaire DOIT pouvoir définir les créneaux horaires disponibles par terrain
- **FR-012**: Chaque créneau DOIT avoir une durée fixe de 2 heures ; aucune autre durée n'est autorisée
- **FR-011**: Le système DOIT persister les données localement entre les sessions

### Key Entities

- **Terrain** : Nom, description optionnelle, liste de créneaux horaires récurrents
- **Créneau** : Heure de début, durée fixe de 2 heures, statut (libre / réservé / passé), lien vers une réservation éventuelle
- **Réservation** : Code unique, terrain, date, créneau, nom du joueur, téléphone (optionnel), horodatage de création

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un joueur peut effectuer une réservation en moins de 2 minutes depuis l'ouverture de l'application
- **SC-002**: Un joueur peut annuler sa réservation en moins de 1 minute via son code
- **SC-003**: Les créneaux disponibles sont visibles instantanément sans temps de chargement perceptible
- **SC-004**: 100 % des créneaux déjà réservés sont correctement signalés comme indisponibles
- **SC-005**: L'application est utilisable sur mobile et desktop sans perte de fonctionnalité

## Demo Data — Terrains genevois pré-chargés

Au premier lancement, l'application propose les terrains suivants comme données d'exemple :

| Nom | Lieu | Surface |
|-----|------|---------|
| Bout-du-Monde — Terrain synthétique 1 | Genève (Champel) | Synthétique |
| Bout-du-Monde — Terrain synthétique 2 | Genève (Champel) | Synthétique |
| Bout-du-Monde — Gazon A | Genève (Champel) | Gazon naturel |
| Centre sportif de Vessy | Genève (Vessy) | Synthétique |
| Centre sportif des Vernets | Genève (Plainpalais) | Synthétique |
| Stade de la Fontenette | Carouge | Synthétique |
| Stade de Lancy-Florimont | Petit-Lancy | Synthétique |
| Stade des Arbères | Meyrin | Synthétique |
| Centre des Evaux — Terrain compétition | Thônex | Gazon naturel |
| Centre des Evaux — Terrain synthétique | Thônex | Synthétique |

Ces données sont modifiables par le gestionnaire après le premier lancement.

## Assumptions

- L'application est destinée à un seul équipement sportif (un club ou une association), pas à une place de marché multi-sites
- Il n'y a pas d'authentification utilisateur : l'accès gestionnaire est protégé par un simple mot de passe ou un accès direct (sans compte)
- Les données sont persistées localement dans le navigateur (localStorage) ; aucun backend n'est requis pour le MVP
- Les créneaux sont définis à l'avance par le gestionnaire (pas de réservation sur mesure avec heure libre) et ont tous une durée fixe de 2 heures
- Le support mobile est inclus dans le périmètre (responsive design)
- Les paiements en ligne sont hors périmètre pour cette version
