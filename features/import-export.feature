# language: fr
Fonctionnalité: Sauvegarde et restauration des données
  En tant que propriétaire
  Je veux exporter et réimporter mes données
  Afin de pouvoir les sauvegarder ou les transférer entre navigateurs

  Contexte:
    Étant donné que des données existent dans l'application
    (au moins un appartement, un locataire et une location)

  Scénario: Exporter les données au format JSON
    Quand je clique sur "Exporter"
    Alors un fichier JSON est téléchargé
    Et son nom suit le format "gestion-locative-AAAA-MM-JJ.json"
    Et son contenu inclut les listes:
      | apartments |
      | tenants    |
      | leases     |
      | payments   |
      | charges    |

  Scénario: Importer un fichier JSON valide
    Étant donné que je dispose d'un fichier "sauvegarde.json" précédemment exporté
    Quand je clique sur "Importer"
    Et que je sélectionne ce fichier
    Et que je confirme le remplacement des données actuelles
    Alors les données de l'application sont remplacées par celles du fichier
    Et le tableau de bord reflète immédiatement les nouvelles données

  Scénario: Annuler l'import après sélection du fichier
    Quand je clique sur "Importer"
    Et que je sélectionne un fichier valide
    Et que je refuse la confirmation de remplacement
    Alors les données actuelles sont conservées intactes

  Scénario: Importer un fichier invalide
    Quand je sélectionne un fichier qui n'est pas un JSON valide
    Alors un message d'erreur explicite est affiché
    Et les données actuelles sont conservées intactes

  Règle: Persistance locale
    Les données sont stockées dans le navigateur (localStorage).
    Elles sont propres à un navigateur et un domaine; un changement
    de poste ou de navigateur nécessite un export/import explicite.
