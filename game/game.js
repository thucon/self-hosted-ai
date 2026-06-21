// --- GAME DATA STRUCTURES ---
const TIME_LIMIT_MINUTES = 10;

let gameState = {
    player: {
        health: 10,
        maxHealth: 10,
        inventory: [],
        location: 'start', // Key corresponding to a room ID
        hasKey: false
    },
    timeRemainingSeconds: TIME_LIMIT_MINUTES * 60,
    gameActive: true
};

// Define the map/rooms
const rooms = {
    'start': {
        name: "Entrance Chamber",
        description: "You are in a damp, stone chamber. Torches flicker on the rough-hewn walls. There is a passage leading North and another East.",
        exits: {
            north: 'hallway',
            east: 'storage'
        },
        items: ['torch'], // Example item
        encounter: null
    },
    'hallway': {
        name: "Dusty Hallway",
        description: "The hallway is long and dimly lit. You hear a faint dripping sound to the west, and a passage leads north.",
        exits: {
            south: 'start',
            north: 'pit_edge'
        },
        items: [],
        encounter: null
    },
    'storage': {
        name: "Storage Room",
        description: "Piles of moldy crates and forgotten junk fill this small room. You spot a rusty key near the back wall.",
        exits: {
            west: 'start'
        },
        items: ['rusty_key'], // Key item
        encounter: null
    },
    'pit_edge': {
        name: "Edge of the Pit",
        description: "You stand at the edge of a deep, dark pit. It looks too dangerous to cross.",
        exits: {
            south: 'hallway'
        },
        items: [],
        encounter: null
    }
};

// --- DOM ELEMENTS CACHE ---
const storyArea = document.getElementById('story-area');
const locationNameDisplay = document.getElementById('location-name');
const healthDisplay = document.getElementById('health-display');
const maxHealthDisplay = document.getElementById('max-health');
const timeRemainingDisplay = document.getElementById('time-remaining');
const messageLog = document.getElementById('message-log');

// --- GAME LOGIC FUNCTIONS ---

/**
 * Updates all visible UI elements based on the current gameState.
 */
function updateUI() {
    // 1. Update Status Bar
    locationNameDisplay.textContent = rooms[gameState.player.location].name;
    healthDisplay.textContent = gameState.player.health;
    maxHealthDisplay.textContent = gameState.player.maxHealth;

    const minutes = Math.floor(gameState.timeRemainingSeconds / 60);
    const seconds = gameState.timeRemainingSeconds % 60;
    timeRemainingDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // 2. Update Action Buttons (This is simplified for now)
    updateActionButtons();
}

/**
 * Displays a message in the main story area and logs it to the message log.
 * @param {string} message The text content of the message.
 * @param {string} type Optional class name for styling (e.g., 'danger', 'success').
 */
function displayMessage(message, type = '') {
    const p = document.createElement('p');
    p.innerHTML = message;
    if (type) {
        p.className = type;
    }
    storyArea.appendChild(p);
    // Scroll to bottom of story area
    storyArea.scrollTop = storyArea.scrollHeight;

    // Log to the dedicated log area as well
    const logP = document.createElement('p');
    logP.innerHTML = `> ${message}`;
    messageLog.appendChild(logP);
}

/**
 * Handles time decay and checks for game over conditions.
 */
function updateTime() {
    if (!gameState.gameActive) return;

    // Decrease time every second (or interval set by setInterval)
    gameState.timeRemainingSeconds--;
    updateUI();

    if (gameState.timeRemainingSeconds <= 0) {
        endGame("You ran out of time! The dungeon claims another victim.");
    } else if (gameState.player.health <= 0) {
        // This should be handled by the action that caused damage, but good to have a fallback
        endGame("Your wounds are too deep. Darkness consumes you.");
    }
}

/**
 * Renders the current room's description and available actions.
 */
function renderRoom() {
    if (!gameState.gameActive) return;

    const currentRoom = rooms[gameState.player.location];
    if (!currentRoom) {
        displayMessage("ERROR: Invalid location!", 'danger');
        return;
    }

    // Clear previous story content (except initial message if desired, but clearing is safer for now)
    storyArea.innerHTML = ''; 
    messageLog.innerHTML = ''; // Clear log on room change

    let description = `\n--- ${currentRoom.name} ---\n`;
    description += `${currentRoom.description}\n`;

    // Display items in the room
    if (currentRoom.items && currentRoom.items.length > 0) {
        const itemNames = currentRoom.items.map(item => item.replace('_', ' ')).join(', ');
        description += `\nYou see the following items here: ${itemNames}.\n`;
    }

    // Display exits
    let exitList = "You can move to: ";
    const exits = Object.keys(currentRoom.exits);
    exitList += exits.map(dir => dir.charAt(0).toUpperCase() + dir.slice(1)).join(', ');
    description += `\nExits available: ${exitList}.\n`;

    displayMessage(description, '');
    updateUI();
}


/**
 * Updates the action buttons based on the current room's exits.
 */
function updateActionButtons() {
    const currentRoom = rooms[gameState.player.location];
    const inputArea = document.getElementById('input-area');

    // Clear existing dynamic buttons (keeping 'Look Around', 'Check Inventory')
    Array.from(inputArea.querySelectorAll('.action-btn')).forEach(button => {
        if (!['look', 'inventory'].includes(button.getAttribute('onclick').match(/'([^']+)'/)[1])) {
            button.remove();
        }
    });

    // Add directional buttons dynamically
    for (const direction in currentRoom.exits) {
        const button = document.createElement('button');
        button.className = 'action-btn';
        button.textContent = `Go ${direction.replace('_', ' ').toUpperCase()}`;
        button.setAttribute('onclick', `handleAction('move_${direction}')`);
        inputArea.appendChild(button);
    }
}


/**
 * Attempts to pick up an item if one is available in the current room and it hasn't been picked up yet.
 */
function handlePickupItem() {
    const currentRoom = rooms[gameState.player.location];
    if (!currentRoom || !currentRoom.items || currentRoom.items.length === 0) {
        displayMessage("There are no items here to pick up.", 'danger');
        return;
    }

    // For simplicity, we'll just pick up the first item found in the room definition
    const itemName = currentRoom.items[0];
    handlePickupItemInternal(itemName);
}

/**
 * Internal logic for handling item pickup and state changes.
 * @param {string} itemName The name of the item to attempt picking up.
 */
function handlePickupItemInternal(itemName) {
    const currentRoom = rooms[gameState.player.location];
    if (!currentRoom || !currentRoom.items.includes(itemName)) {
        displayMessage(`There are no ${itemName} items here to pick up.`, 'danger');
        return;
    }

    // Remove item from room and add to inventory
    currentRoom.items = currentRoom.items.filter(item => item !== itemName);
    gameState.player.inventory.push(itemName);
    displayMessage(`You picked up the ${itemName}.`, 'success');

    // Special logic for key pickup
    if (itemName === 'rusty_key') {
        gameState.player.hasKey = true;
        displayMessage("The rusty key feels heavy in your hand.", 'success');
    }

    updateUI();
    renderRoom(); // Rerender to show item is gone and update status
}


/**
 * Main action handler called by buttons. Determines the game flow.
 * @param {string} actionKey The key representing the action (e.g., 'look', 'move_north').
 */
function handleAction(actionKey) {
    if (!gameState.gameActive) return;

    // 1. Handle Movement Actions (e.g., move_north)
    if (actionKey.startsWith('move_')) {
        const direction = actionKey.split('_')[1];
        attemptMove(direction);
        return;
    }

    // 2. Handle Utility Actions
    switch (actionKey) {
        case 'look':
            renderRoom(); // Re-renders the room description
            break;
        case 'inventory':
            displayMessage(`You are carrying: ${gameState.player.inventory.length > 0 ? gameState.player.inventory.join(', ') : 'nothing.'}`, 'success');
            break;
        case 'pickup_item': // New action handler for picking up items
            handlePickupItem();
            break;
        default:
            displayMessage("Unknown action.", 'danger');
    }
}

/**
 * Attempts to move the player in a given direction.
 * @param {string} direction The direction key (e.g., 'north').
 */
function attemptMove(direction) {
    const currentRoom = rooms[gameState.player.location];
    if (!currentRoom || !currentRoom.exits[direction]) {
        displayMessage("You cannot go that way.", 'danger');
        return;
    }

    const nextLocationKey = currentRoom.exits[direction];
    const nextRoom = rooms[nextLocationKey];

    // Check for special movement requirements (e.g., needing a key)
    if (nextLocationKey === 'storage' && !gameState.player.hasKey) {
        displayMessage("The passage is blocked by heavy debris. You need something to clear it.", 'danger');
        return;
    }

    // Successful move
    gameState.player.location = nextLocationKey;
    displayMessage(`You travel ${direction}.`, '');
    renderRoom(); // Rerender the room for the new location
}

/**
 * Attempts to move the player in a given direction.
 * @param {string} direction The direction key (e.g., 'north').
 */
function attemptMove(direction) {
    const currentRoom = rooms[gameState.player.location];
    if (!currentRoom || !currentRoom.exits[direction]) {
        displayMessage("You cannot go that way.", 'danger');
        return;
    }

    const nextLocationKey = currentRoom.exits[direction];
    const nextRoom = rooms[nextLocationKey];

    // Check for special movement requirements (e.g., needing a key)
    if (nextLocationKey === 'storage' && !gameState.player.hasKey) {
        displayMessage("The passage is blocked by heavy debris. You need something to clear it.", 'danger');
        return;
    }

    // Successful move
    gameState.player.location = nextLocationKey;
    displayMessage(`You travel ${direction}.`, '');
    renderRoom(); // Rerender the room for the new location
}


/**
 * Handles picking up an item if one is available in the current room.
 */
function handlePickupItem(itemName) {
    const currentRoom = rooms[gameState.player.location];
    if (!currentRoom || !currentRoom.items.includes(itemName)) {
        displayMessage(`There are no ${itemName} items here to pick up.`, 'danger');
        return;
    }

    // Remove item from room and add to inventory
    currentRoom.items = currentRoom.items.filter(item => item !== itemName);
    gameState.player.inventory.push(itemName);
    displayMessage(`You picked up the ${itemName}.`, 'success');

    // Special logic for key pickup
    if (itemName === 'rusty_key') {
        gameState.player.hasKey = true;
        displayMessage("The rusty key feels heavy in your hand.", 'success');
    }

    updateUI();
    renderRoom(); // Rerender to show item is gone and update status
}


/**
 * Ends the game with a final message.
 * @param {string} endingMessage The narrative text for the end of the game.
 */
function endGame(endingMessage) {
    gameState.gameActive = false;
    // Disable all buttons to prevent further interaction
    document.querySelectorAll('.action-btn').forEach(button => {
        button.disabled = true;
        button.style.opacity = '0.5';
    });

    displayMessage(`\n========================================`, '');
    displayMessage(`${endingMessage}`, 'danger');
    displayMessage(`GAME OVER! Final Score: ${Math.floor(gameState.timeRemainingSeconds / 60)} minutes remaining.`, 'danger');
}


// --- INITIALIZATION ---

/**
 * Sets up the game environment and starts the loop.
 */
function initializeGame() {
    // Set up the interval for time decay (runs every second)
    setInterval(updateTime, 1000);

    // Initial render of the starting room
    renderRoom();
}

// Start the game when the script loads
initializeGame();