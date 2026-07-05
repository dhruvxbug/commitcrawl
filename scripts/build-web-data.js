import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const ROOMS_DIR = path.join(process.cwd(), "rooms");
const OUT_FILE = path.join(process.cwd(), "web", "rooms.json");

function loadRooms() {
  const files = fs
    .readdirSync(ROOMS_DIR)
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"));

  const rooms = {};
  for (const file of files) {
    const data = yaml.load(fs.readFileSync(path.join(ROOMS_DIR, file), "utf8"));
    if (data && data.id) rooms[data.id] = data;
  }
  return rooms;
}

const rooms = loadRooms();
fs.writeFileSync(OUT_FILE, JSON.stringify(rooms, null, 2));
console.log(`Built web/rooms.json with ${Object.keys(rooms).length} room(s).`);
