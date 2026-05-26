# language: fr
Fonctionnalité: Suivi des charges
  En tant que propriétaire
  Je veux enregistrer les charges liées à mes appartements
  Afin de suivre mes dépenses (taxe foncière, copropriété, travaux, etc.)

  Contexte:
    Étant donné qu'il existe l'appartement "Studio Paris 11"
    Et que je navigue vers la vue "Charges"

  Scénario: Enregistrer une charge
    Quand je crée une charge avec:
      | Appartement | Studio Paris 11 |
      | Date        | 2026-04-15      |
      | Montant     | 1200.00         |
      | Catégorie   | Taxe foncière   |
      | Libellé     | Taxe foncière 2026 |
    Alors la charge apparaît en haut de la liste
    Et son montant affiché est "1 200,00 €"

  Scénario: Catégories disponibles
    Quand j'ouvre le formulaire "Nouvelle charge"
    Alors le sélecteur "Catégorie" propose les valeurs:
      | Taxe foncière |
      | Copropriété   |
      | Travaux       |
      | Assurance     |
      | Entretien     |
      | Autre         |

  Scénario: Filtrer les charges par appartement
    Étant donné qu'il existe des charges pour plusieurs appartements
    Quand je sélectionne un appartement dans le filtre "Appartement"
    Alors seules les charges de cet appartement sont affichées

  Scénario: Tri des charges
    Quand j'affiche la liste des charges
    Alors les charges sont triées par date décroissante

  Scénario: Champs obligatoires
    Quand j'ouvre le formulaire "Nouvelle charge"
    Alors les champs suivants sont obligatoires:
      | Appartement |
      | Date        |
      | Montant     |
      | Catégorie   |

  Scénario: Empêcher la création sans appartement
    Étant donné qu'aucun appartement n'a encore été créé
    Quand je clique sur "Nouvelle charge"
    Alors un message m'invite à créer d'abord un appartement
    Et le formulaire de charge ne s'ouvre pas

  Règle: Cumul annuel sur le tableau de bord
    Le tableau de bord affiche la somme des charges sur les 12 derniers mois.

    Exemple: Charges récentes incluses
      Étant donné la date du jour "2026-05-06"
      Et une charge de 1200,00 € datée du "2026-04-15"
      Et une charge de 500,00 € datée du "2025-06-01"
      Et une charge de 800,00 € datée du "2025-04-01"
      Quand j'affiche le tableau de bord
      Alors le total "Charges (12 mois)" est "1 700,00 €"
