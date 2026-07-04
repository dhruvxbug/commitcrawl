import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const ROOMS_DIR = path.join(process.cwd(), "rooms");
const VALID_DIRECTIONS = ["north", "south", "east", "west", "up", "down", "in", "out"];

function loadRooms() {
  const files = fs
    .readdirSync(ROOMS_DIR)
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"));

  const rooms = new Map();
  const errors = [];

  for (const file of files) {
    const fullPath = path.join(ROOMS_DIR, file);
    const expectedId = file.replace(/\.yaml$/, "");
    let data;

    try {
      data = yaml.load(fs.readFileSync(fullPath, "utf8"));
    } catch (e) {
      errors.push(`[${file}] Invalid YAML: ${e.message}`);
      continue;
    }

    if (!data || typeof data !== "object") {
      errors.push(`[${file}] Empty or malformed room file.`);
      continue;
    }

    if (!data.id) {
      errors.push(`[${file}] Missing required field: id`);
    } else if (data.id !== expectedId) {
      errors.push(`[${file}] id "${data.id}" does not match filename "${expectedId}"`);
    }

    if (!data.title) errors.push(`[${file}] Missing required field: title`);
    if (!data.description) errors.push(`[${file}] Missing required field: description`);
    if (!data.author) errors.push(`[${file}] Missing required field: author`);

    if (!data.exits || typeof data.exits !== "object" || Object.keys(data.exits).length === 0) {
      errors.push(`[${file}] Room must have at least one exit.`);
    } else {
      for (const dir of Object.keys(data.exits)) {
        if (!VALID_DIRECTIONS.includes(dir)) {
          errors.push(`[${file}] Invalid direction "${dir}". Use one of: ${VALID_DIRECTIONS.join(", ")}`);
        }
      }
    }

    rooms.set(expectedId, data);
  }

  return { rooms, errors };
}

function checkConnectivity(rooms, errors) {
  for (const [id, room] of rooms.entries()) {
    if (!room.exits) continue;
    for (const [dir, target] of Object.entries(room.exits)) {
      const isLockedDoor = String(target).startsWith("TODO-");
      if (!isLockedDoor && !rooms.has(target)) {
        errors.push(
          `[${id}.yaml] Exit "${dir}" points to "${target}", which doesn't exist. ` +
            `If this is intentional, prefix it with "TODO-" to mark it as a locked door.`
        );
      }
    }
  }

  // Warn (not error) if a room other than the entrance has no incoming exits.
  const reachable = new Set(["000-entrance"]);
  for (const room of rooms.values()) {
    if (!room.exits) continue;
    for (const target of Object.values(room.exits)) {
      if (rooms.has(target)) reachable.add(target);
    }
  }
  const orphans = [...rooms.keys()].filter((id) => !reachable.has(id));
  if (orphans.length) {
    console.warn(
      `⚠️  Warning: these rooms have no incoming exit from anywhere else and may be unreachable: ${orphans.join(", ")}`
    );
  }
}

function main() {
  const { rooms, errors } = loadRooms();
  checkConnectivity(rooms, errors);

  if (errors.length) {
    console.error(`❌ Found ${errors.length} problem(s):\n`);
    errors.forEach((e) => console.error(" - " + e));
    process.exit(1);
  }

  console.log(`✅ ${rooms.size} room(s) validated successfully. The dungeon holds.`);
}

main();
