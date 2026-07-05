// ---------- tiny deterministic PRNG (so the map layout doesn't jump around on reload) ----------
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededRandom(seed) {
  let s = seed;
  return function () {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    s >>>= 0;
    return (s % 100000) / 100000;
  };
}

const VALID_DIRECTIONS = ["north", "south", "east", "west", "up", "down", "in", "out"];

async function main() {
  const rooms = await fetch("rooms.json").then((r) => r.json());
  const roomIds = Object.keys(rooms);

  document.getElementById("room-count").textContent = `${roomIds.length} room${roomIds.length === 1 ? "" : "s"} built`;

  // ---------- build graph: real rooms + ghost nodes for locked (TODO-) doors ----------
  const nodes = new Map();
  const edges = [];

  for (const id of roomIds) {
    nodes.set(id, { id, ghost: false, room: rooms[id] });
  }

  for (const id of roomIds) {
    const room = rooms[id];
    if (!room.exits) continue;
    for (const [dir, target] of Object.entries(room.exits)) {
      const locked = String(target).startsWith("TODO-");
      if (locked && !nodes.has(target)) {
        nodes.set(target, { id: target, ghost: true, room: null });
      }
      edges.push({ from: id, to: target, dir, locked });
    }
  }

  layoutNodes(nodes, edges);
  renderMap(nodes, edges, onSelectRoom);

  const initial = rooms["000-entrance"] ? "000-entrance" : roomIds[0];
  if (initial) onSelectRoom(initial);
  else renderEmptyState();

  function onSelectRoom(id) {
    const node = nodes.get(id);
    highlightNode(id);
    if (!node || node.ghost) {
      renderLockedDetail(id);
    } else {
      renderRoomDetail(node.room, rooms, onSelectRoom);
    }
  }
}

// ---------- force-directed layout ----------
function layoutNodes(nodes, edges) {
  const list = [...nodes.values()];
  const rand = seededRandom(hashSeed(list.map((n) => n.id).join("|")) || 1);

  const W = 900, H = 620;
  list.forEach((n) => {
    n.x = W / 2 + (rand() - 0.5) * W * 0.8;
    n.y = H / 2 + (rand() - 0.5) * H * 0.8;
    n.vx = 0; n.vy = 0;
  });

  const idealLen = 150;
  for (let iter = 0; iter < 400; iter++) {
    // repulsion between every pair
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = 2200 / (dist * dist);
        dx /= dist; dy /= dist;
        a.vx += dx * force; a.vy += dy * force;
        b.vx -= dx * force; b.vy -= dy * force;
      }
    }
    // spring along edges
    for (const e of edges) {
      const a = nodes.get(e.from), b = nodes.get(e.to);
      if (!a || !b) continue;
      let dx = b.x - a.x, dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force = (dist - idealLen) * 0.02;
      dx /= dist; dy /= dist;
      a.vx += dx * force; a.vy += dy * force;
      b.vx -= dx * force; b.vy -= dy * force;
    }
    // gentle pull to center + integrate
    for (const n of list) {
      n.vx += (W / 2 - n.x) * 0.001;
      n.vy += (H / 2 - n.y) * 0.001;
      n.x += n.vx * 0.6;
      n.y += n.vy * 0.6;
      n.vx *= 0.82; n.vy *= 0.82;
    }
  }

  // normalize into a padded viewport
  const pad = 70;
  const xs = list.map((n) => n.x), ys = list.map((n) => n.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1), spanY = Math.max(maxY - minY, 1);

  list.forEach((n) => {
    n.x = pad + ((n.x - minX) / spanX) * (W - pad * 2);
    n.y = pad + ((n.y - minY) / spanY) * (H - pad * 2);
  });

  nodes.__viewBox = `0 0 ${W} ${H}`;
}

// ---------- SVG rendering ----------
function wobblyPath(x1, y1, x2, y2, seed) {
  const rand = seededRandom(seed);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const offset = (rand() - 0.5) * Math.min(len * 0.4, 40);
  const cx = mx + nx * offset, cy = my + ny * offset;
  return `M ${x1.toFixed(1)},${y1.toFixed(1)} Q ${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

function renderMap(nodes, edges, onSelect) {
  const svg = document.getElementById("map-svg");
  svg.setAttribute("viewBox", nodes.__viewBox);
  svg.innerHTML = "";

  const passageLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const nodeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");

  edges.forEach((e) => {
    const a = nodes.get(e.from), b = nodes.get(e.to);
    if (!a || !b) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", wobblyPath(a.x, a.y, b.x, b.y, hashSeed(e.from + e.to + e.dir)));
    path.setAttribute("class", "passage" + (e.locked ? " locked" : ""));
    passageLayer.appendChild(path);
  });

  nodes.forEach((n) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "node-group" + (n.ghost ? " ghost" : ""));
    g.setAttribute("data-id", n.id);
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", n.ghost ? "Unbuilt room" : n.room.title);

    if (!n.ghost) {
      const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      glow.setAttribute("class", "torch-glow");
      glow.setAttribute("cx", n.x);
      glow.setAttribute("cy", n.y);
      glow.setAttribute("r", 22);
      g.appendChild(glow);
    }

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "node-circle");
    circle.setAttribute("cx", n.x);
    circle.setAttribute("cy", n.y);
    circle.setAttribute("r", n.ghost ? 10 : 14);
    g.appendChild(circle);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "node-label");
    label.setAttribute("x", n.x);
    label.setAttribute("y", n.y + (n.ghost ? 24 : 28));
    label.textContent = n.ghost ? "?" : truncate(n.room.title, 16);
    g.appendChild(label);

    g.addEventListener("click", () => onSelect(n.id));
    g.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" || evt.key === " ") { evt.preventDefault(); onSelect(n.id); }
    });

    nodeLayer.appendChild(g);
  });

  svg.appendChild(passageLayer);
  svg.appendChild(nodeLayer);
}

function highlightNode(id) {
  document.querySelectorAll(".node-group").forEach((g) => {
    g.classList.toggle("selected", g.getAttribute("data-id") === id);
  });
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

// ---------- detail pane ----------
function renderRoomDetail(room, rooms, onSelect) {
  const pane = document.getElementById("detail-pane");

  const artHtml = room.image
    ? `<img src="${escapeAttr(room.image)}" alt="${escapeAttr(room.title)}" />`
    : room.ascii_art
    ? `<pre>${escapeHtml(room.ascii_art.trimEnd())}</pre>`
    : "";

  const itemsHtml = room.items && room.items.length
    ? `<div class="room-section"><h3>Items</h3><div class="pill-row">${room.items
        .map((i) => `<span class="pill" title="${escapeAttr(i.description || "")}">${escapeHtml(i.name)}</span>`)
        .join("")}</div></div>`
    : "";

  const monsterHtml = room.monster
    ? `<div class="room-section"><div class="monster-box"><strong>${escapeHtml(room.monster.name)}</strong> — "${escapeHtml(room.monster.greeting || "")}"</div></div>`
    : "";

  const exitsHtml = room.exits
    ? `<div class="room-section"><h3>Exits</h3><div class="pill-row">${Object.entries(room.exits)
        .map(([dir, target]) => {
          const locked = String(target).startsWith("TODO-");
          return `<button class="exit-btn${locked ? " locked" : ""}" data-target="${escapeAttr(target)}" ${locked ? "disabled" : ""}>${escapeHtml(dir)}${locked ? " (locked)" : ""}</button>`;
        })
        .join("")}</div></div>`
    : "";

  const eggHtml = room.easter_egg
    ? `<div class="room-section"><p class="easter-egg">✧ ${escapeHtml(room.easter_egg)}</p></div>`
    : "";

  pane.innerHTML = `
    <div class="room-card">
      <span class="room-id">${escapeHtml(room.id)}</span>
      <h2>${escapeHtml(room.title)}</h2>
      ${artHtml ? `<div class="room-art">${artHtml}</div>` : ""}
      <p class="room-description">${escapeHtml(room.description.trim())}</p>
      ${monsterHtml}
      ${itemsHtml}
      ${exitsHtml}
      ${eggHtml}
    </div>
  `;

  pane.querySelectorAll(".exit-btn:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => onSelect(btn.getAttribute("data-target")));
  });
}

function renderLockedDetail(id) {
  const pane = document.getElementById("detail-pane");
  pane.innerHTML = `
    <div class="empty-state">
      <p>This door hasn't been opened yet.</p>
      <p>Room <code>${escapeHtml(id)}</code> doesn't exist — someone needs to build it.</p>
      <p><a href="https://github.com/dexter-ifti/commitcrawl/blob/master/CONTRIBUTING.md" target="_blank" rel="noopener">Read how to add it →</a></p>
    </div>
  `;
}

function renderEmptyState() {
  document.getElementById("detail-pane").innerHTML =
    `<div class="empty-state"><p>The dungeon is empty. Be the first to build a room.</p></div>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function escapeAttr(str) { return escapeHtml(str); }

main();
