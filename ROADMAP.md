# Roadmap / Side Quests

Adding a room is the easy path. These are for contributors who want to sink their
teeth into something bigger. None of these are required — pick whatever sounds fun.

## Engine improvements
- [ ] Inventory system (pick up / use items across rooms)
- [ ] Combat system with HP, damage ranges, win/lose states
- [ ] Save/load progress to a local file
- [ ] Random events / weighted encounters
- [ ] A `map` command that renders an ASCII map of visited rooms

## Tooling
- [ ] `scripts/generate-map.js` — output a Graphviz/SVG map of the whole dungeon
- [ ] Contributor leaderboard (rooms added, generated from git history)
- [ ] A GitHub Action that posts a rendered preview of a new room as a PR comment

## Ports
- [ ] Python engine in `engine/python/`
- [ ] Rust engine in `engine/rust/`
- [ ] Web-based player (static site reading the same YAML files)

## Lore / meta
- [ ] A "boss room" that requires 2 PR approvals to unlock (community governance joke)
- [ ] Seasonal events (a room that only "opens" during Hacktoberfest, etc.)

Got an idea not listed here? Open an issue — this list is not exhaustive.
