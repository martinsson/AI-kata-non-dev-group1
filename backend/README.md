# Backend Gestion locative — Spring Boot + PostgreSQL

API REST pour l'application de gestion locative (appartements, locataires,
baux, paiements, charges).

## Stack

- Java 21, Spring Boot 3.3
- Spring Web, Spring Data JPA, Bean Validation
- PostgreSQL 16, Flyway pour les migrations
- Maven

## Lancer en local

### 1. Démarrer PostgreSQL

```bash
docker compose up -d
```

Cela démarre Postgres sur `localhost:5432` avec :
- base : `gestion_locative`
- user / password : `gestion` / `gestion`

### 2. Lancer l'application

```bash
./mvnw spring-boot:run
# ou
mvn spring-boot:run
```

L'API écoute sur `http://localhost:8080`. Au démarrage, Flyway applique la
migration `V1__init.sql` qui crée le schéma.

### 3. Variables d'environnement utiles

| Variable        | Défaut                                              |
| --------------- | --------------------------------------------------- |
| `DB_URL`        | `jdbc:postgresql://localhost:5432/gestion_locative` |
| `DB_USER`       | `gestion`                                           |
| `DB_PASSWORD`   | `gestion`                                           |
| `SERVER_PORT`   | `8080`                                              |
| `CORS_ORIGINS`  | `http://localhost:5173,http://localhost:8000,https://martinsson.github.io` |

## Endpoints

Tous les endpoints sont préfixés par `/api`.

### Appartements
- `GET    /apartments`
- `POST   /apartments`
- `GET    /apartments/{id}`
- `PUT    /apartments/{id}`
- `DELETE /apartments/{id}`

### Locataires
- `GET    /tenants`
- `POST   /tenants`
- `GET    /tenants/{id}`
- `PUT    /tenants/{id}`
- `DELETE /tenants/{id}`

### Locations (baux)
- `GET    /leases` — inclut `status` calculé (`ACTIVE` / `ENDED`)
- `POST   /leases`
- `GET    /leases/{id}`
- `PUT    /leases/{id}`
- `DELETE /leases/{id}`

### Paiements
- `GET    /payments?leaseId=&status=` — filtres optionnels, tri par date desc
- `POST   /payments`
- `GET    /payments/{id}`
- `PUT    /payments/{id}`
- `PATCH  /payments/{id}/mark-paid`
- `DELETE /payments/{id}`
- `POST   /payments/generate-current-month` — idempotent, génère un loyer
  `PENDING` pour chaque location active sans paiement de loyer ce mois-ci

### Charges
- `GET    /charges?apartmentId=`
- `POST   /charges`
- `GET    /charges/{id}`
- `PUT    /charges/{id}`
- `DELETE /charges/{id}`

### Tableau de bord
- `GET    /dashboard/stats` — `{ apartments, tenants, activeLeases, monthlyRent, unpaid, yearCharges }`

## Format des erreurs

```json
{
  "timestamp": "...",
  "status": 400,
  "error": "Bad Request",
  "message": "Données invalides",
  "fields": { "name": "Le nom est obligatoire" }
}
```

## Mapping avec les specs Gherkin

| Domaine Gherkin        | Package             |
| ---------------------- | ------------------- |
| `appartements.feature` | `apartment`         |
| `locataires.feature`   | `tenant`            |
| `locations.feature`    | `lease`             |
| `loyers.feature`       | `payment`           |
| `charges.feature`      | `charge`            |
| `tableau-de-bord.feature` | `dashboard`      |

L'export/import JSON décrit dans `import-export.feature` reste côté frontend
(`localStorage`); pour synchroniser avec ce backend il faudra ajouter un
endpoint d'import bulk si besoin — pas inclus dans cette version.

## Tests

```bash
mvn test
```

Le profil de test utilise H2 en mode Postgres-compat — la base de prod reste
PostgreSQL.
