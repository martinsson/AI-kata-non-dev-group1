# language: fr
Fonctionnalité: Gestion des locations (baux)
  En tant que propriétaire
  Je veux créer et suivre les baux liant un appartement à un locataire
  Afin de connaître à tout moment les locations actives et leurs loyers

  Contexte:
    Étant donné qu'il existe l'appartement "Studio Paris 11"
    Et qu'il existe le locataire "Dupont Marie"
    Et que je navigue vers la vue "Locations"

  Scénario: Créer une location avec date de fin
    Quand je crée une location avec:
      | Appartement        | Studio Paris 11 |
      | Locataire          | Dupont Marie    |
      | Date de début      | 2026-01-01      |
      | Date de fin        | 2026-12-31      |
      | Loyer mensuel      | 850.00          |
      | Charges mensuelles | 50.00           |
      | Dépôt de garantie  | 850.00          |
    Alors la location "Studio Paris 11 — Dupont Marie" apparaît dans la liste
    Et son statut affiché dépend de la date du jour:
      | Date du jour            | Statut attendu |
      | avant 2026-01-01        | Terminée       |
      | entre 2026-01-01 et 2026-12-31 | Active   |
      | après 2026-12-31        | Terminée       |

  Scénario: Créer un bail à durée indéterminée (sans date de fin)
    Quand je crée une location avec:
      | Appartement        | Studio Paris 11 |
      | Locataire          | Dupont Marie    |
      | Date de début      | 2026-01-01      |
      | Loyer mensuel      | 850.00          |
    Alors la location est créée sans date de fin
    Et son statut est "Active" tant que la date de début est passée

  Scénario: Empêcher la création sans appartement ni locataire
    Étant donné qu'aucun appartement n'a encore été créé
    Quand je clique sur "Nouvelle location"
    Alors un message m'invite à créer d'abord un appartement et un locataire
    Et le formulaire de location ne s'ouvre pas

  Scénario: Champs obligatoires
    Quand j'ouvre le formulaire "Nouvelle location"
    Alors les champs suivants sont obligatoires:
      | Appartement     |
      | Locataire       |
      | Date de début   |
      | Loyer mensuel   |

  Scénario: Modifier un bail
    Étant donné qu'il existe une location active pour "Studio Paris 11" / "Dupont Marie"
    Quand j'ouvre sa modification
    Et que je passe le loyer mensuel à 880.00
    Et que je valide le formulaire
    Alors le loyer affiché dans la liste est "880,00 €"

  Scénario: Avertir avant suppression d'une location avec paiements
    Étant donné qu'il existe une location avec au moins un paiement enregistré
    Quand je clique sur "Supprimer" pour cette location
    Alors une confirmation m'avertit que des paiements y sont rattachés
    Et la suppression n'est effective que si je confirme

  Règle: Le statut Active est calculé dynamiquement
    Le statut "Active / Terminée" est dérivé de la date du jour
    et des dates de début / fin du bail; il n'est pas stocké manuellement.

    Exemple: Bail futur affiché Terminé jusqu'à sa date de début
      Étant donné une location avec date de début "2030-01-01"
      Et la date du jour est "2026-05-06"
      Alors le statut affiché est "Terminée"
