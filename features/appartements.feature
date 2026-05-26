# language: fr
Fonctionnalité: Gestion des appartements
  En tant que propriétaire
  Je veux maintenir la liste de mes appartements
  Afin de pouvoir y rattacher des locations et des charges

  Contexte:
    Étant donné que j'ouvre l'application
    Et que je navigue vers la vue "Appartements"

  Scénario: Ajouter un appartement avec les informations minimales
    Quand je clique sur "Nouvel appartement"
    Et que je saisis "Studio Paris 11" dans le champ "Nom / référence"
    Et que je valide le formulaire
    Alors l'appartement "Studio Paris 11" apparaît dans la liste
    Et le compteur "Appartements" du tableau de bord est incrémenté de 1

  Scénario: Ajouter un appartement avec toutes les informations
    Quand je crée un appartement avec:
      | Nom              | T3 Lyon Croix-Rousse        |
      | Adresse          | 12 rue des Tables Claudiennes |
      | Surface          | 68.5                         |
      | Pièces           | 3                            |
      | Notes            | Balcon, dernier étage        |
    Alors l'appartement "T3 Lyon Croix-Rousse" apparaît dans la liste
    Et la surface affichée est "68.5 m²"

  Scénario: Le nom est obligatoire
    Quand j'ouvre le formulaire "Nouvel appartement"
    Et que je laisse le champ "Nom / référence" vide
    Et que je valide le formulaire
    Alors le formulaire reste ouvert
    Et le champ "Nom / référence" est signalé comme requis

  Scénario: Modifier un appartement existant
    Étant donné qu'il existe un appartement "Studio Paris 11"
    Quand je clique sur "Modifier" pour cet appartement
    Et que je remplace le nom par "Studio Paris 11 - Bastille"
    Et que je valide le formulaire
    Alors l'appartement s'affiche désormais sous le nom "Studio Paris 11 - Bastille"

  Scénario: Supprimer un appartement non rattaché
    Étant donné qu'il existe un appartement "Studio vacant"
    Et qu'aucune location ni charge n'est rattachée à cet appartement
    Quand je clique sur "Supprimer" pour cet appartement
    Et que je confirme la suppression
    Alors l'appartement "Studio vacant" disparaît de la liste

  Scénario: Avertir lors de la suppression d'un appartement référencé
    Étant donné qu'il existe un appartement "T3 Lyon" rattaché à une location active
    Quand je clique sur "Supprimer" pour cet appartement
    Alors une confirmation m'avertit que des locations ou charges y sont rattachées
    Et la suppression n'est effective que si je confirme

  Scénario: Liste vide
    Étant donné qu'aucun appartement n'a été créé
    Quand j'affiche la vue "Appartements"
    Alors un message m'invite à ajouter mon premier appartement
