# language: fr
Fonctionnalité: Tableau de bord
  En tant que propriétaire
  Je veux une vue synthétique de mon parc
  Afin de connaître en un coup d'œil mes revenus, impayés et locations actives

  Contexte:
    Étant donné que je navigue vers la vue "Tableau de bord"

  Scénario: Indicateurs principaux
    Alors la vue affiche les compteurs suivants:
      | Appartements     |
      | Locataires       |
      | Locations actives|
      | Loyers mensuels  |
      | Impayés          |
      | Charges (12 mois)|

  Règle: Calcul des "Loyers mensuels"
    "Loyers mensuels" est la somme, pour toutes les locations actives,
    de leur loyer mensuel ajouté à leurs charges mensuelles.

    Exemple:
      Étant donné les locations actives:
        | Loyer  | Charges |
        | 850.00 | 50.00   |
        | 700.00 | 0.00    |
      Alors le compteur "Loyers mensuels" affiche "1 600,00 €"

  Règle: Calcul des "Impayés"
    "Impayés" est la somme des montants des paiements ayant le statut "En attente",
    indépendamment de leur date.

    Exemple:
      Étant donné les paiements:
        | Montant | Statut     |
        | 900.00  | En attente |
        | 850.00  | Payé       |
        | 700.00  | En attente |
      Alors le compteur "Impayés" affiche "1 600,00 €"

  Scénario: Liste des locations actives
    Étant donné qu'il existe au moins une location active
    Alors la section "Locations actives" liste:
      | Appartement | Locataire | Début | Fin | Loyer | Charges |

  Scénario: Liste des derniers paiements
    Étant donné qu'au moins un paiement a été enregistré
    Alors la section "Derniers paiements" affiche au plus 8 paiements
    Et ils sont triés par date décroissante

  Scénario: Aucune donnée
    Étant donné qu'aucune donnée n'a été saisie
    Alors les compteurs affichent "0" ou "0,00 €"
    Et les sections "Locations actives" et "Derniers paiements" affichent un état vide
