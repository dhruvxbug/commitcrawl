# 🏰 CommitCrawl

A dungeon that only exists because people keep sending pull requests.

CommitCrawl is a text-adventure game with **zero fixed map** — every room is a small YAML
file added by a contributor. Clone it, walk through whatever exists today, then leave a
**locked door** behind for the next person to open.

No build tools. No compiler. No account. Just YAML and imagination.

```
git clone https://github.com/dexter-ifti/commitcrawl.git
cd commitcrawl
npm install
npm start
```

Then type things like `look`, `go north`, `take biscuit`, `fight goblin king`.

## Why this exists

This repo has exactly one rule: **anyone, any skill level, can add one room in under
10 minutes.** No PR should ever need more than copy → edit → submit.

At the same time, the *engine* that plays the dungeon is intentionally simple and
open to improvement — so if you're the kind of dev who wants to add an inventory
system, a combat mechanic, a map generator, or a whole new engine in Python/Rust/Go,
there's a real project underneath the silliness. See [`ROADMAP.md`](./ROADMAP.md) for
ideas if you want to go deeper than "add a room."

## How the dungeon grows

Every room can have exits to rooms that **don't exist yet** — these are "locked doors."
Finding one in-game is an open invitation: build the room behind it, in your own PR,
in your own voice.

```yaml
exits:
  north: 003-mirror-maze     # this room exists
  east: TODO-clocktower      # this one doesn't yet — build it!
```

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) — it's short on purpose. One room, one PR,
as weird as you like.

## Current dungeon size

Rooms so far: check the [`rooms/`](./rooms) folder — the count only ever goes up.

## License

MIT — see [`LICENSE`](./LICENSE). The dungeon is everyone's.
