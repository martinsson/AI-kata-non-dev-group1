# Spécifications Gherkin — Gestion locative

Ce dossier contient les spécifications fonctionnelles de l'application au format
Gherkin (français), prêtes à être retravaillées.

## Organisation

| Fichier                       | Domaine                                     |
| ----------------------------- | ------------------------------------------- |
| `appartements.feature`        | CRUD des appartements                       |
| `locataires.feature`          | CRUD des locataires                         |
| `locations.feature`           | Baux : création, modification, statut       |
| `loyers.feature`              | Paiements, génération mensuelle, filtres    |
| `charges.feature`             | Charges par appartement                     |
| `tableau-de-bord.feature`     | Indicateurs synthétiques et règles de calcul|
| `import-export.feature`       | Sauvegarde JSON, persistance locale         |

## Conventions

- Mots-clés en français (`Fonctionnalité`, `Scénario`, `Règle`, `Étant donné`, `Quand`, `Alors`, `Et`, `Exemple`).
- Les tables Gherkin servent à la fois pour les jeux de données et pour
  documenter les contraintes métier (champs obligatoires, catégories...).
- Les règles métier non triviales sont exprimées via `Règle:` + `Exemple:`
  pour rester lisibles indépendamment de l'implémentation.
- Les montants sont affichés au format français : `1 200,00 €`.
- Les dates sont au format ISO `AAAA-MM-JJ` dans les scénarios; l'affichage est
  localisé `JJ/MM/AAAA`.

## Pour retravailler

Édite directement les `.feature`. Si tu veux les exécuter plus tard avec
Cucumber.js / Playwright, garde la structure actuelle — elle est compatible
avec les runners Gherkin standards.
