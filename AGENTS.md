# CommitCrawl AI Agent Directory

This repository relies heavily on AI and community contributions. Based on your task, load the corresponding instructions from the `.agent/` directory:

1. **Adding or editing a room (YAML)** -> Read `.agent/room-builder.md`
2. **Modifying the core game engine (Node.js/JS)** -> Read `.agent/engine-architect.md`
3. **Reviewing a Pull Request** -> Read `.agent/pr-reviewer.md`

## Global Rules
- **Zero-build for rooms:** Rooms are pure YAML. No code compilation.
- **Minimalism:** Do not add heavy dependencies. Prefer native Node.js (`fs`, `path`) over external packages unless handling complex parsing (e.g., `js-yaml`).
- **Open-source only:** Do not suggest or integrate paid APIs.