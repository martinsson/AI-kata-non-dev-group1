# language: fr
Fonctionnalité: Suivi des loyers et paiements
  En tant que propriétaire
  Je veux enregistrer les paiements de mes locations
  Afin de suivre les loyers payés et les impayés

  Contexte:
    Étant donné qu'il existe une location active "Studio Paris 11 — Dupont Marie"
      | Loyer mensuel      | 850.00 |
      | Charges mensuelles | 50.00  |
    Et que je navigue vers la vue "Loyers et paiements"

  Scénario: Enregistrer un paiement de loyer reçu
    Quand je crée un paiement avec:
      | Location | Studio Paris 11 — Dupont Marie |
      | Date     | 2026-05-05                     |
      | Montant  | 900.00                         |
      | Type     | Loyer                          |
      | Statut   | Payé                           |
    Alors le paiement apparaît en haut de la liste
    Et il porte le badge "Payé"

  Scénario: Enregistrer un paiement en attente
    Quand je crée un paiement avec statut "En attente"
    Alors il apparaît avec le badge "En attente"
    Et il est inclus dans le total "Impayés" du tableau de bord

  Scénario: Marquer un paiement en attente comme payé
    Étant donné qu'il existe un paiement en attente pour cette location
    Quand je clique sur "Marquer payé" pour ce paiement
    Alors son badge devient "Payé"
    Et il n'est plus inclus dans le total "Impayés"

  Scénario: Générer les loyers du mois en cours
    Étant donné que la date du jour est "2026-05-06"
    Et que les locations actives suivantes existent:
      | Location                       | Loyer  | Charges |
      | Studio Paris 11 — Dupont Marie | 850.00 | 50.00   |
      | T2 Lyon — Martin Paul          | 700.00 | 0.00    |
    Et qu'aucun paiement de type "Loyer" n'existe pour le mois "2026-05"
    Quand je clique sur "Générer le mois en cours"
    Alors deux paiements sont créés avec:
      | Date       | Montant | Type  | Statut     |
      | 2026-05-05 | 900.00  | Loyer | En attente |
      | 2026-05-05 | 700.00  | Loyer | En attente |
    Et un message confirme "2 paiement(s) généré(s) pour 2026-05"

  Scénario: Ne pas dupliquer les loyers déjà générés
    Étant donné qu'un paiement de loyer existe déjà pour la location et le mois en cours
    Quand je clique sur "Générer le mois en cours"
    Alors aucun paiement n'est créé pour cette location
    Et un message indique que tous les paiements existent déjà

  Scénario: Filtrer les paiements par location
    Étant donné qu'il existe des paiements pour plusieurs locations
    Quand je sélectionne une location dans le filtre "Location"
    Alors seuls les paiements de cette location sont affichés

  Scénario: Filtrer les paiements par statut
    Quand je sélectionne "En attente" dans le filtre "Statut"
    Alors seuls les paiements en attente sont affichés

  Scénario: Tri des paiements
    Quand j'affiche la liste des paiements
    Alors les paiements sont triés par date décroissante (plus récents en premier)

  Règle: Champs obligatoires
    Pour qu'un paiement soit enregistrable, il faut:
      | Champ    | Contrainte               |
      | Location | renseignée               |
      | Date     | date valide              |
      | Montant  | nombre positif ou nul    |
      | Type     | "Loyer" ou "Charges"     |
      | Statut   | "Payé" ou "En attente"   |
