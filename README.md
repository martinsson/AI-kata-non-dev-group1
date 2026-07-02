# AI-kata-non-dev-group1

Jeu de **Belote** jouable en solo contre 3 joueurs fictifs (Sud + Nord contre Ouest + Est).
Tout tient dans un seul fichier autonome : `site/index.html` (aucune dépendance, aucun build).

## Jouer en local (localhost)

Le plus simple — via le script fourni :

```bash
./serve.sh            # sert le jeu sur http://localhost:8000
./serve.sh 3000       # ou sur un autre port
```

Ou à la main :

```bash
cd site && python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Comme la page est 100 % autonome, on peut aussi simplement **ouvrir `site/index.html`**
directement dans un navigateur (double-clic), sans serveur.

## Déploiement (GitHub Pages)

Éditer les fichiers dans `site/`, pousser sur `main`, GitHub Actions déploie sur Pages.

One-time per fork/clone : **Settings → Pages → Source: GitHub Actions**.
