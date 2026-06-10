# AI-kata-non-dev-group1

Edit files in `site/`, push to `main`, GitHub Actions deploys to Pages.

One-time per fork/clone: **Settings → Pages → Source: GitHub Actions**.

## Tests

Simulation des bots de Punto Jungle (Facile / Moyen / Difficile) dans une
même partie à 3 joueurs, avec statistiques de victoire :

```sh
node tests/bot-simulation.js            # 200 manches (1200 parties)
node tests/bot-simulation.js 500        # plus de parties
```

Le script sort en code `0` si l'ordre attendu **Difficile > Moyen > Facile**
est respecté, `1` sinon.
