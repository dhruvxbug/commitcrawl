# Contributing to CommitCrawl

Thanks for wanting to add to the dungeon. Here's everything you need to know.

## The one rule

**One PR = one room.** Keep it small so it's fast to review and fast to write.

## Steps

1. Copy `rooms/_template.yaml` to `rooms/NNN-your-room-name.yaml`
   (use the next free number — check the highest existing file).
2. Fill it in. Be as silly, dramatic, or unhinged as you like.
3. Link at least **one exit** to an existing room, so your room is reachable.
4. Optionally leave a **locked door** — an exit to a room ID that doesn't exist yet
   (prefix it with `TODO-`, e.g. `TODO-haunted-library`). Someone else may build it later.
5. Run `npm run validate` locally (optional — CI will also check this on your PR).
6. Open a PR. Describe your room in one sentence. That's it.

## What makes a good room

- It connects to the existing dungeon (at least one real exit in).
- It has a description with actual personality — funny, weird, ominous, whatever.
- It doesn't break anyone else's room (don't repoint someone else's exits, don't
  delete rooms that aren't yours).

## What if I'm not "creative"

Totally fine. A one-line joke room is a valid contribution. So is a room that's
just a vending machine that only accepts Canadian nickels. Low effort, high fun,
that's the whole point.

## Want to do something bigger?

The `engine/` folder is a normal small codebase. PRs are welcome for:
- New commands (inventory, combat, save/load)
- A map generator/visualizer
- A port of the engine to another language
- CI/tooling improvements

Check [`ROADMAP.md`](./ROADMAP.md) for ideas, or open an issue with your own.

## Code of conduct

Be kind, keep it PG-13, don't be a jerk in reviews. That's it.
