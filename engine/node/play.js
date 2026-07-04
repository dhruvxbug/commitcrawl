import fs from "fs";
import path from "path";
import readline from "readline";
import yaml from "js-yaml";

const ROOMS_DIR = path.join(process.cwd(), "rooms");

function loadRooms() {
  const files = fs
    .readdirSync(ROOMS_DIR)
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"));

  const rooms = new Map();
  for (const file of files) {
    const data = yaml.load(fs.readFileSync(path.join(ROOMS_DIR, file), "utf8"));
    if (data && data.id) rooms.set(data.id, data);
  }
  return rooms;
}

const rooms = loadRooms();
let currentId = rooms.has("000-entrance") ? "000-entrance" : [...rooms.keys()][0];
const inventory = [];
const defeated = new Set();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function describeRoom(room) {
  console.log(`\n=== ${room.title} ===`);
  console.log(room.description.trim());

  if (room.monster && !defeated.has(room.id)) {
    console.log(`\nA ${room.monster.name} is here. It says: "${room.monster.greeting}"`);
  }

  if (room.items && room.items.length) {
    console.log("\nYou see:");
    room.items.forEach((i) => console.log(`  - ${i.name}`));
  }

  if (room.exits) {
    const exits = Object.entries(room.exits).map(([dir, target]) => {
      const locked = String(target).startsWith("TODO-");
      return locked ? `${dir} (a locked door — unbuilt)` : dir;
    });
    console.log(`\nExits: ${exits.join(", ")}`);
  }
}

function prompt() {
  rl.question("\n> ", (input) => handleCommand(input.trim().toLowerCase()));
}

function handleCommand(input) {
  const room = rooms.get(currentId);
  const [verb, ...rest] = input.split(" ");
  const arg = rest.join(" ");

  if (input === "look") {
    describeRoom(room);
  } else if (verb === "go" && arg) {
    const target = room.exits && room.exits[arg];
    if (!target) {
      console.log(`You can't go ${arg} from here.`);
    } else if (String(target).startsWith("TODO-")) {
      console.log("There's a door here, but it hasn't been built yet. Maybe you should build it?");
    } else if (!rooms.has(target)) {
      console.log("That exit leads nowhere (broken room reference).");
    } else {
      currentId = target;
      describeRoom(rooms.get(currentId));
    }
  } else if (verb === "take" && arg) {
    const item = room.items && room.items.find((i) => i.name.toLowerCase().includes(arg));
    if (item) {
      inventory.push(item.name);
      room.items = room.items.filter((i) => i !== item);
      console.log(`You take the ${item.name}.`);
    } else {
      console.log("You don't see that here.");
    }
  } else if (verb === "fight" && room.monster && !defeated.has(room.id)) {
    defeated.add(room.id);
    console.log(`You bravely fight the ${room.monster.name}... and somehow win. It shuffles off, muttering.`);
  } else if (input === "inventory" || input === "i") {
    console.log(inventory.length ? `You are carrying: ${inventory.join(", ")}` : "You have nothing.");
  } else if (input === "help") {
    console.log("Commands: look, go <direction>, take <item>, fight, inventory, quit");
  } else if (input === "quit" || input === "exit") {
    console.log("You climb out of the dungeon. See you next time.");
    rl.close();
    return;
  } else {
    console.log("Not sure how to do that. Type 'help' for commands.");
  }

  prompt();
}

console.log("Welcome to CommitCrawl. Type 'help' for commands.");
describeRoom(rooms.get(currentId));
prompt();
