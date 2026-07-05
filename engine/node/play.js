import fs from "fs";
import path from "path";
import readline from "readline";
import yaml from "js-yaml";

const ROOMS_DIR = path.join(process.cwd(), "rooms");

function getAllYamlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllYamlFiles(filePath, fileList);
    } else if (file.endsWith(".yaml") && !file.startsWith("_")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function loadRooms() {
  const files = getAllYamlFiles(ROOMS_DIR);

  const rooms = new Map();
  for (const fullPath of files) {
    const data = yaml.load(fs.readFileSync(fullPath, "utf8"));
    if (data && data.id) rooms.set(data.id, data);
  }
  return rooms;
}

const rooms = loadRooms();
const args = process.argv.slice(2);
const level = args[0];
const cour = args[1];
const startRoomId = level ? `l${level}c${cour || '1'}-00-entrance` : "000-entrance";
let currentId = rooms.has(startRoomId) ? startRoomId : [...rooms.keys()][0];
const inventory = [];
const defeated = new Set();
let activePuzzleState = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function describeRoom(room) {
  const match = room.id.match(/^l(\d+)c(\d+)-/);
  const levelStr = match ? ` (Level ${match[1]}, Cour ${match[2]})` : "";
  console.log(`\n=== ${room.title}${levelStr} ===`);
  console.log(room.description.trim());

  if (room.monster && !defeated.has(room.id)) {
    console.log(
      `\nA ${room.monster.name} is here. It says: "${room.monster.greeting}"`,
    );
  }

  if (room.items && room.items.length) {
    console.log("\nYou see:");
    room.items.forEach((i) => console.log(`  - ${i.name}`));
  }

  if (room.exits) {
    const exits = Object.entries(room.exits).map(([dir, target]) => {
      const isLockedByPuzzle = room.puzzle && !room.puzzle.solved && room.puzzle.locked_exit === dir;
      if (isLockedByPuzzle) return `${dir} (locked by puzzle)`;
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
  const [verb, ...rest] = input.split(" ");
  const arg = rest.join(" ");

  if (activePuzzleState) {
    const { room, phase } = activePuzzleState;
    if (input === "quit" || input === "exit") {
      console.log("You climb out of the dungeon. See you next time.");
      rl.close();
      return;
    }
    
    if (phase === 'CONFIRM_START') {
      if (input === 'ok') {
        console.log(room.puzzle.question);
        console.log("Place the answer item in the box (Command: place <item>)");
        activePuzzleState.phase = 'AWAIT_ANSWER';
      } else {
        console.log("Puzzle cancelled.");
        activePuzzleState = null;
      }
      prompt();
      return;
    } else if (phase === 'AWAIT_ANSWER') {
      if (verb === 'place') {
        const item = inventory.find((i) => i.name.toLowerCase().includes(arg));
        if (!item) {
          console.log(`You don't have '${arg}' in your inventory to place.`);
          activePuzzleState = null;
        } else if (item.name.toLowerCase().includes(room.puzzle.answer.toLowerCase())) {
          console.log(room.puzzle.success_msg);
          room.puzzle.solved = true;
          inventory.splice(inventory.indexOf(item), 1);
          activePuzzleState = null;
        } else {
          console.log("Incorrect. The box hums angrily and rejects the item.");
          activePuzzleState = null;
        }
      } else {
        console.log("Invalid command. You must 'place <item>' to answer.");
        activePuzzleState = null;
      }
      prompt();
      return;
    }
  }

  const room = rooms.get(currentId);

  if (input === "look") {
    describeRoom(room);
  } else if (verb === "go" && arg) {
    if (room.puzzle && !room.puzzle.solved && room.puzzle.locked_exit === arg) {
      console.log(room.puzzle.description);
      console.log("Solve puzzle to open door? (Type 'ok' to continue)");
      activePuzzleState = { room, phase: 'CONFIRM_START' };
      prompt();
      return;
    }
    const target = room.exits && room.exits[arg];
    if (!target) {
      console.log(`You can't go ${arg} from here.`);
    } else if (String(target).startsWith("TODO-")) {
      console.log(
        "There's a door here, but it hasn't been built yet. Maybe you should build it?",
      );
    } else if (!rooms.has(target)) {
      console.log("That exit leads nowhere (broken room reference).");
    } else {
      currentId = target;
      describeRoom(rooms.get(currentId));
    }
  } else if (verb === "take" && arg) {
    const item =
      room.items && room.items.find((i) => i.name.toLowerCase().includes(arg));
    if (item) {
      inventory.push(item);
      room.items = room.items.filter((i) => i !== item);
      console.log(`You take the ${item.name}.`);
    } else {
      console.log("You don't see that here.");
    }
  } else if (verb === "use" && arg) {
    const item = inventory.find((i) => i.name.toLowerCase().includes(arg));
    if (item) {
      if (item.on_use) {
        console.log(item.on_use);
        if (item.consumable) {
          inventory.splice(inventory.indexOf(item), 1);
        }
      } else {
        console.log(`You use the ${item.name}. Nothing interesting happens.`);
      }
    } else {
      console.log("You don't have that in your inventory.");
    }
  } else if (verb === "fight" && room.monster && !defeated.has(room.id)) {
    defeated.add(room.id);
    console.log(
      `You bravely fight the ${room.monster.name}... and somehow win. It shuffles off, muttering.`,
    );
  } else if (input === "inventory" || input === "i") {
    console.log(
      inventory.length
        ? `You are carrying: ${inventory.map((i) => i.name).join(", ")}`
        : "You have nothing.",
    );
  } else if (input === "help") {
    console.log(
      "Commands: look, go <direction>, take <item>, check <item>, use <item>, place <item>, fight, inventory, quit",
    );
  } else if (input === "quit" || input === "exit") {
    console.log("You climb out of the dungeon. See you next time.");
    rl.close();
    return;
  } else if (verb === "check" && arg) {
    const roomItem =
      room.items && room.items.find((i) => i.name.toLowerCase().includes(arg));

    const inventoryItem = inventory.find((i) =>
      i.name.toLowerCase().includes(arg),
    );

    const item = roomItem || inventoryItem;

    if (item) {
      console.log(`\n${item.name}`);
      console.log(item.description);
    } else {
      console.log("You don't see or have that item.");
    }
  } else {
    console.log("Not sure how to do that. Type 'help' for commands.");
  }
  
  prompt();
}

console.log("Welcome to CommitCrawl. Type 'help' for commands.");
describeRoom(rooms.get(currentId));
prompt();
