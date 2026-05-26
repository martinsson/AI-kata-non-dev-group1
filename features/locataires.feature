# language: fr
Fonctionnalité: Gestion des locataires
  En tant que propriétaire
  Je veux gérer le carnet de mes locataires
  Afin de leur associer des locations

  Contexte:
    Étant donné que je navigue vers la vue "Locataires"

  Scénario: Ajouter un locataire
    Quand je crée un locataire avec:
      | Nom        | Dupont               |
      | Prénom     | Marie                |
      | Email      | marie.dupont@mail.fr |
      | Téléphone  | 06 12 34 56 78       |
      | Notes      | Garant: ses parents  |
    Alors le locataire "Dupont Marie" apparaît dans la liste
    Et le compteur "Locataires" du tableau de bord est incrémenté de 1

  Scénario: Le nom et le prénom sont obligatoires
    Quand j'ouvre le formulaire "Nouveau locataire"
    Et que je laisse le champ "Nom" vide
    Et que je valide le formulaire
    Alors le formulaire reste ouvert
    Et le champ "Nom" est signalé comme requis

  Scénario: Modifier un locataire
    Étant donné qu'il existe un locataire "Dupont Marie"
    Quand j'ouvre la modification de ce locataire
    Et que je remplace l'email par "marie@nouveau.fr"
    Et que je valide le formulaire
    Alors l'email du locataire est désormais "marie@nouveau.fr"

  Scénario: Supprimer un locataire sans location
    Étant donné qu'il existe un locataire "Martin Paul" sans location associée
    Quand je le supprime et confirme
    Alors le locataire "Martin Paul" disparaît de la liste

  Scénario: Avertir avant suppression d'un locataire avec location
    Étant donné qu'il existe un locataire "Dupont Marie" associé à une location
    Quand je clique sur "Supprimer" pour ce locataire
    Alors une confirmation m'avertit que des locations y sont rattachées
    Et je peux choisir d'annuler ou de confirmer la suppression
