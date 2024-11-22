const schema = require('@colyseus/schema');
const { Schema, MapSchema, ArraySchema, type } = schema;

class Character extends Schema {
    constructor(id = 0, power = 0, emo = "", rarity = "", defense = 0, type = "", mojo = 0) {
        super();
        // Initialize with safe defaults to handle null or undefined inputs
        this.id = id || 0; // Default to 0 if not provided
        this.power = power || 0;
        this.emo = emo || "";
        this.rarity = rarity || "common"; // Default rarity
        this.defense = defense || 0;
        this.type = type || "generic"; // Default type
        this.mojo = mojo || 0;
        this.health = 100; // Fixed default
        this.isDisabled = false; // Default disabled state
    }

    validate() {
        // Basic validation checks to avoid invalid states
        if (typeof this.id !== "number" || this.id < 0) throw new Error("Invalid Character ID");
        if (typeof this.power !== "number" || this.power < 0) throw new Error("Invalid Character Power");
        if (typeof this.health !== "number" || this.health < 0 || this.health > 100) {
            throw new Error("Character Health must be between 0 and 100");
        }
    }
}

class Player extends Schema {
    constructor() {
        super();
        this.characters = new ArraySchema(); // Initialize ArraySchema
        this.defendedCharacterIndex = -1; // Default to -1 (no character defended)
        this.sessionId = ""; // Empty string as default
        this.ready = false; // Default ready state
    }

    addCharacter(character) {
        if (!(character instanceof Character)) {
            throw new Error("Invalid character added to Player");
        }
        // Add character with validation
        character.validate();
        this.characters.push(character);
    }

    validate() {
        // Ensure the sessionId is valid and characters are properly initialized
        if (!this.sessionId || typeof this.sessionId !== "string") {
            throw new Error("Player sessionId must be a valid non-empty string");
        }
        if (this.defendedCharacterIndex < -1 || this.defendedCharacterIndex >= this.characters.length) {
            throw new Error("Invalid defendedCharacterIndex");
        }
    }
}

class MyRoomState extends Schema {
    constructor() {
        super();
        this.players = new MapSchema(); // Initialize MapSchema
        this.turn = 0; // Start at turn 0
        this.countdown = 3; // Default countdown
        this.gameStarted = false; // Default to not started
        this.winner = ""; // Empty string for winner
        this.worldType = "standard"; // Default worldType
    }

    addPlayer(sessionId) {
        if (this.players[sessionId]) {
            throw new Error("Player with this sessionId already exists");
        }
        const player = new Player();
        player.sessionId = sessionId;
        this.players[sessionId] = player;
    }

    validate() {
        // Ensure all players are valid
        for (const [key, player] of Object.entries(this.players)) {
            if (!(player instanceof Player)) {
                throw new Error(`Invalid player object in MyRoomState: ${key}`);
            }
            player.validate();
        }

        // Validate other state variables
        if (this.turn < 0) throw new Error("Turn cannot be negative");
        if (this.countdown < 0) throw new Error("Countdown cannot be negative");
    }
}

// Define types with the schema library
schema.defineTypes(Character, {
    id: "number",
    power: "number",
    emo: "string",
    rarity: "string",
    defense: "number",
    type: "string",
    mojo: "number",
    health: "number",
    isDisabled: "boolean"
});

schema.defineTypes(Player, {
    characters: [Character],
    defendedCharacterIndex: "int8",
    sessionId: "string",
    ready: "boolean"
});

schema.defineTypes(MyRoomState, {
    players: { map: Player },
    turn: "uint8",
    countdown: "uint8",
    gameStarted: "boolean",
    winner: "string",
    worldType: "string"
});

// Export schemas
module.exports = { MyRoomState, Player, Character };
