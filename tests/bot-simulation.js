#!/usr/bin/env node
/*
 * Simulation des bots de Punto Jungle.
 *
 * Fait s'affronter les 3 niveaux de bot (Facile / Moyen / Difficile) dans
 * une MEME partie a 3 joueurs, repetee un grand nombre de fois, puis affiche
 * les statistiques de victoire par niveau.
 *
 * Pour etre equitable, chaque "manche" joue les 6 permutations possibles des
 * niveaux sur les 3 sieges (l'ordre de jeu avantage le premier joueur), de
 * sorte que chaque niveau occupe chaque siege le meme nombre de fois.
 *
 * IMPORTANT : la logique du moteur et de l'IA ci-dessous est une copie fidele
 * de celle embarquee dans site/index.html. Si tu modifies l'IA dans le jeu,
 * reporte les memes changements ici (et inversement).
 *
 *   Usage : node tests/bot-simulation.js [manches]
 *           (defaut : 200 manches => 1200 parties)
 */

"use strict";

const GRID = 13;
const CENTER = 6;
const SIZE_LIMIT = 6;
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

// ---- Etat global du moteur (comme dans le jeu) ----
let grid, players, current, currentCard;

function shuffledDeck() {
  const deck = [];
  for (let n = 1; n <= 9; n++) { deck.push(n); deck.push(n); } // 1..9 deux fois = 18
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ---------- Geometrie du plateau ----------
function bounds() {
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity, any = false;
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (grid[r][c]) {
        any = true;
        minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        minC = Math.min(minC, c); maxC = Math.max(maxC, c);
      }
  return any ? { minR, maxR, minC, maxC } : null;
}

function isAdjacentToOccupied(r, c) {
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= GRID || nc >= GRID) continue;
      if (grid[nr][nc]) return true;
    }
  return false;
}

function withinSizeLimit(r, c) {
  const b = bounds();
  if (!b) return true;
  const minR = Math.min(b.minR, r), maxR = Math.max(b.maxR, r);
  const minC = Math.min(b.minC, c), maxC = Math.max(b.maxC, c);
  return (maxR - minR) < SIZE_LIMIT && (maxC - minC) < SIZE_LIMIT;
}

function isValidPlacement(r, c) {
  if (!currentCard) return false;
  const target = grid[r][c];
  const b = bounds();
  if (!b) return r === CENTER && c === CENTER;
  if (target) return currentCard.value > target.value;
  return isAdjacentToOccupied(r, c) && withinSizeLimit(r, c);
}

// ---------- Detection de victoire ----------
function checkWin(owner) {
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++) {
      const cell = grid[r][c];
      if (!cell || cell.owner !== owner) continue;
      for (const [dr, dc] of DIRS) {
        let len = 1, nr = r + dr, nc = c + dc;
        while (nr >= 0 && nc >= 0 && nr < GRID && nc < GRID &&
               grid[nr][nc] && grid[nr][nc].owner === owner) {
          len++; if (len >= 4) return true;
          nr += dr; nc += dc;
        }
      }
    }
  return false;
}

// ---------- IA (copie fidele de site/index.html) ----------
function runLen(r, c, dr, dc, owner) {
  let n = 0, nr = r + dr, nc = c + dc;
  while (nr >= 0 && nc >= 0 && nr < GRID && nc < GRID &&
         grid[nr][nc] && grid[nr][nc].owner === owner) {
    n++; nr += dr; nc += dc;
  }
  return n;
}

function completesFour(r, c, owner) {
  for (const [dr, dc] of DIRS) {
    if (1 + runLen(r, c, dr, dc, owner) + runLen(r, c, -dr, -dc, owner) >= 4) return true;
  }
  return false;
}

function computeThreatCells(me) {
  const threats = new Set();
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++) {
      if (grid[r][c]) continue;
      if (!isAdjacentToOccupied(r, c) || !withinSizeLimit(r, c)) continue;
      for (const p of players) {
        if (p.idx === me || p.deck.length === 0) continue;
        if (completesFour(r, c, p.idx)) { threats.add(r + "," + c); break; }
      }
    }
  return threats;
}

function runWeight(total) {
  if (total >= 4) return 100000;
  if (total === 3) return 45;
  if (total === 2) return 9;
  return 1;
}

function cellExtensible(r, c) {
  if (r < 0 || c < 0 || r >= GRID || c >= GRID) return false;
  if (grid[r][c]) return false;
  return isAdjacentToOccupied(r, c) && withinSizeLimit(r, c);
}

function isWinningMove(r, c, me, val) {
  const prev = grid[r][c];
  grid[r][c] = { owner: me, value: val };
  let win = false;
  for (const [dr, dc] of DIRS) {
    if (1 + runLen(r, c, dr, dc, me) + runLen(r, c, -dr, -dc, me) >= 4) { win = true; break; }
  }
  grid[r][c] = prev;
  return win;
}

function openThreeForks(r, c, owner) {
  let forks = 0;
  for (const [dr, dc] of DIRS) {
    const f = runLen(r, c, dr, dc, owner);
    const b = runLen(r, c, -dr, -dc, owner);
    if (1 + f + b !== 3) continue;
    const aheadR = r + (f + 1) * dr, aheadC = c + (f + 1) * dc;
    const behindR = r - (b + 1) * dr, behindC = c - (b + 1) * dc;
    if (cellExtensible(aheadR, aheadC) || cellExtensible(behindR, behindC)) forks++;
  }
  return forks;
}

function countOpponentThreats(me) {
  return computeThreatCells(me).size;
}

function evaluateBotMove(r, c, me, val, threatCells) {
  let score = 0;
  const prev = grid[r][c];
  if (!prev && threatCells.has(r + "," + c)) score += 8000;

  grid[r][c] = { owner: me, value: val };
  let bestRun = 1;
  for (const [dr, dc] of DIRS) {
    const total = 1 + runLen(r, c, dr, dc, me) + runLen(r, c, -dr, -dc, me);
    bestRun = Math.max(bestRun, total);
    score += runWeight(total);
  }
  if (bestRun >= 4) score += 100000;
  grid[r][c] = prev;

  if (prev && prev.owner !== me) score += 6 + prev.value * 0.5;

  const b = bounds();
  if (b) {
    const midR = (b.minR + b.maxR) / 2, midC = (b.minC + b.maxC) / 2;
    score -= (Math.abs(r - midR) + Math.abs(c - midC)) * 0.15;
  }
  return score;
}

function evaluateBotMoveHard(r, c, me, val, threatCells) {
  let score = evaluateBotMove(r, c, me, val, threatCells);
  const prev = grid[r][c];
  grid[r][c] = { owner: me, value: val };
  const forks = openThreeForks(r, c, me);
  if (forks >= 2) score += 6000;
  else if (forks === 1) score += 160;
  const remaining = countOpponentThreats(me);
  score -= remaining * 9000;
  grid[r][c] = prev;
  return score;
}

function chooseBotMove(moves, me, val, diff) {
  if (diff === "facile") {
    const wins = moves.filter(([r, c]) => isWinningMove(r, c, me, val));
    if (wins.length && Math.random() < 0.5) {
      return wins[Math.floor(Math.random() * wins.length)];
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }
  const threatCells = computeThreatCells(me);
  const evalFn = diff === "difficile" ? evaluateBotMoveHard : evaluateBotMove;
  let best = moves[0], bestScore = -Infinity;
  for (const [r, c] of moves) {
    const s = evalFn(r, c, me, val, threatCells) + Math.random() * 0.5;
    if (s > bestScore) { bestScore = s; best = [r, c]; }
  }
  return best;
}

// ---------- Boucle de partie ----------
// seatDiffs : tableau des niveaux par siege, ex. ["facile","moyen","difficile"]
// Renvoie l'index du siege gagnant, ou -1 pour un match nul.
function playGame(seatDiffs) {
  grid = Array.from({ length: GRID }, () => Array(GRID).fill(null));
  players = seatDiffs.map((d, i) => ({ idx: i, deck: shuffledDeck(), diff: d }));
  current = 0;

  const draw = () => {
    const p = players[current];
    currentCard = p.deck.length ? { owner: p.idx, value: p.deck[p.deck.length - 1] } : null;
  };
  const advance = () => {
    for (let i = 1; i <= players.length; i++) {
      const idx = (current + i) % players.length;
      if (players[idx].deck.length > 0) { current = idx; draw(); return true; }
    }
    return false;
  };

  draw();
  let guard = 0;
  while (true) {
    if (++guard > 100000) return -1; // garde-fou anti-boucle
    const me = current;
    const p = players[me];
    if (currentCard) {
      const moves = [];
      for (let r = 0; r < GRID; r++)
        for (let c = 0; c < GRID; c++)
          if (isValidPlacement(r, c)) moves.push([r, c]);
      if (moves.length) {
        const [r, c] = chooseBotMove(moves, me, currentCard.value, p.diff);
        grid[r][c] = { owner: me, value: currentCard.value };
        p.deck.pop();
        if (checkWin(me)) return me;
      }
    }
    if (!players.some(x => x.deck.length > 0)) return -1; // plus de cartes => nul
    if (!advance()) return -1;
  }
}

// ---------- Statistiques ----------
function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  arr.forEach((x, i) => {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permutations(rest)) out.push([x, ...p]);
  });
  return out;
}

function run(rounds) {
  const LEVELS = ["facile", "moyen", "difficile"];
  const perms = permutations(LEVELS); // 6 dispositions de sieges
  const wins = { facile: 0, moyen: 0, difficile: 0 };
  let draws = 0, total = 0;

  for (let round = 0; round < rounds; round++) {
    for (const seatDiffs of perms) {
      const winnerSeat = playGame(seatDiffs);
      total++;
      if (winnerSeat < 0) draws++;
      else wins[seatDiffs[winnerSeat]]++;
    }
  }

  const pct = (n) => ((n / total) * 100).toFixed(1).padStart(5) + " %";
  const pad = (s) => String(s).padEnd(10);

  console.log(`\nPunto Jungle — simulation des bots`);
  console.log(`Parties a 3 joueurs (un bot de chaque niveau) : ${total} parties`);
  console.log(`(${rounds} manches x ${perms.length} permutations de sieges)\n`);
  console.log(`  ${pad("Niveau")}${"Victoires".padStart(10)}${"Taux".padStart(10)}`);
  console.log(`  ${"-".repeat(30)}`);
  for (const lvl of LEVELS) {
    console.log(`  ${pad(lvl)}${String(wins[lvl]).padStart(10)}${pct(wins[lvl]).padStart(10)}`);
  }
  console.log(`  ${pad("nuls")}${String(draws).padStart(10)}${pct(draws).padStart(10)}`);

  // Verification : l'ordre attendu est Difficile > Moyen > Facile.
  const ok = wins.difficile > wins.moyen && wins.moyen > wins.facile;
  console.log(`\nOrdre attendu (Difficile > Moyen > Facile) : ${ok ? "OK ✅" : "ECHEC ❌"}\n`);
  return ok;
}

const rounds = parseInt(process.argv[2], 10) || 200;
const ok = run(rounds);
process.exit(ok ? 0 : 1);
