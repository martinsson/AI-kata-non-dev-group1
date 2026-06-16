# Workshop facilitation

Facilitator notes for running the "petite appli avec une IA, sans coder" kata
across the five group repositories. Not needed by participants.

> **This lives on the `facilitation` branch only**, in this central repo. It is
> deliberately kept off `main` so the reset tooling never propagates to the
> group repos (reset distributes the `start/*` tag, i.e. `main`, not this
> branch). Run resets from here: `git switch facilitation`.

## Layout

- **Local `main`** is the single source of truth — the *starting point* every
  group repo is reset to before a session.
- Five Git remotes point at the five group repos:

  | remote   | repo                                            |
  | -------- | ----------------------------------------------- |
  | `group1` | `martinsson/AI-kata-non-dev-group1`             |
  | `group2` | `martinsson/AI-kata-non-dev-group2`             |
  | `group3` | `martinsson/AI-kata-non-dev-group3`             |
  | `group4` | `martinsson/AI-kata-non-dev-group4`             |
  | `group5` | `martinsson/AI-kata-non-dev-group5`             |

  (`git remote -v` to confirm.)

- During a session each group works on **their own repo's `main`** (and on
  `claude/*` branches Claude creates). Between sessions we reset their `main`
  back to the starting point without losing what they did.

## Tag conventions

| Tag             | Lives on      | Means                                                              |
| --------------- | ------------- | ----------------------------------------------------------------- |
| `start/<date>`  | all repos     | The starting point. Reset always rewinds `main` to this commit.   |
| `<session-tag>` | each group    | A snapshot of *that group's* `main` work, taken just before reset. |

Both are **immutable tags**, so a group's work is preserved and is never
garbage-collected even after `main` is rewound. Tags are simpler and safer than
branches for this — they don't move and won't be touched on the next reset.

# Reset workflow (between sessions)

Run from the repo root. The script preserves work, then rewinds each group's
`main` to the starting point.

### 1. (Only when the starting point changes) tag a new starting point

The starting point only needs a new tag when *you* have changed the scaffold
(new slides, new skeleton, etc.). Tag local `main` and push the tag everywhere:

```bash
TAG=start/$(date +%F)
git tag "$TAG" main
for r in group1 group2 group3 group4 group5; do git push "$r" "$TAG"; done
```

The reset script otherwise picks up the newest `start/*` tag automatically.

### 2. Preview the reset (always do this first)

```bash
./scripts/reset-workshop.sh session-$(date +%F) --dry-run
```

Pick a `<session-tag>` that identifies the session you are closing, e.g.
`session-2026-06-16-morning`. It must be **fresh** each time — the script
refuses to overwrite a session tag that already exists on a remote.

### 3. Run the reset

```bash
./scripts/reset-workshop.sh session-2026-06-16-morning
```

For each remote the script:

1. `git fetch <remote>` — get their latest `main`.
2. Push `<session-tag>` pointing at their current `main` → **their work is saved.**
3. Force-reset their `main` to the `start/*` tag (with `--force-with-lease`).
4. Re-push the `start/*` tag so the repo always carries it.

`claude/*`, `solution/*`, `gh-pages` and any other branches are **left
untouched** — only `main` is rewound.

### Options

```
./scripts/reset-workshop.sh <session-tag> [options]

  --start <tag>       Reset target. Default: newest start/* tag.
  --remotes "g1 g3"   Limit to specific remotes. Default: all five.
  -n, --dry-run       Show the plan, change nothing.
  -y, --yes           Skip the confirmation prompt.
```

## Recovering a group's work later

Each session tag is a normal Git ref on the group's repo:

```bash
git fetch group3 --tags
git log group3/main..session-2026-06-16-morning   # what they added that session
git switch -c review-group3 session-2026-06-16-morning
```

List what has been preserved on a remote:

```bash
git ls-remote --tags group3
```
