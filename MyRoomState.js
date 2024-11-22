const schema = require('@colyseus/schema');
const { Schema, MapSchema, ArraySchema, type } = schema;

// Custom error class for game-specific errors
class GameError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GameError';
    }
}

// Game Constants
const WORLD_TYPES = ['city', 'forest', 'water'];

const EMO_TYPES = {
    HAPPINESS: 'Happiness',
    SADNESS: 'Sadness',
    ANGER: 'Anger',
    FEAR: 'Fear',
    SURPRISE: 'Surprise',
    DISGUST: 'Disgust',
    LOVE: 'Love',
    CURIOSITY: 'Curiosity'
};

const RARITY_TYPES = {
    COMMON: 'Common',
    RARE: 'Rare',
    LEGENDARY: 'Legendary'
};

const GAME_PHASES = {
    WAITING: 'waiting',
    CARD_SELECTION: 'cardSelection',
    PLAYING: 'playing',
    ENDED: 'ended'
};

class Character extends Schema {
    constructor(id = 0, power = 0, emo = "", rarity = RARITY_TYPES.COMMON, defense = 0, type = "", mojo = 0) {
        super();
        this.id = id ?? 0;
        this.power = power ?? 0;
        this.emo = emo ?? "";
        this.rarity = rarity ?? RARITY_TYPES.COMMON;
        this.defense = defense ?? 0;
        this.type = type ?? "";
        this.mojo = mojo ?? 0;
        this.health = 100;
        this.isDisabled = false;
        this.validate();
    }

    validate() {
        if (!Number.isInteger(this.id) || this.id < 0) {
            throw new GameError("Character ID must be a non-negative integer");
        }
        if (!Number.isFinite(this.power) || this.power < 0) {
            throw new GameError("Character Power must be a non-negative number");
        }
        if (typeof this.emo !== "string") {
            throw new GameError("Character Emo must be a string");
        }
        if (!Object.values(RARITY_TYPES).includes(this.rarity)) {
            throw new GameError("Invalid Character Rarity");
        }
        if (!Number.isFinite(this.defense) || this.defense < 0) {
            throw new GameError("Character Defense must be a non-negative number");
        }
        if (typeof this.type !== "string" || !this.type) {
            throw new GameError("Character Type must be a non-empty string");
        }
        if (!Number.isFinite(this.mojo) || this.mojo < 0 || this.mojo > 10) {
            throw new GameError("Character Mojo must be between 0 and 10");
        }
        if (!Number.isFinite(this.health) || this.health < 0 || this.health > 100) {
            throw new GameError("Character Health must be between 0 and 100");
        }
    }

    takeDamage(amount) {
        if (!Number.isFinite(amount) || amount < 0) {
            throw new GameError("Damage amount must be a positive number");
        }
        this.health = Math.max(0, this.health - amount);
        if (this.health === 0) {
            this.isDisabled = true;
        }
        this.validate();
        return this.health;
    }
}

class Player extends Schema {
    static MAX_CHARACTERS = 3; // From the game logic, players select exactly 3 cards

    constructor() {
        super();
        this.characters = new ArraySchema();
        this.defendedCharacterIndex = -1;
        this.sessionId = "";
        this.ready = false;
    }

    addCharacter(character) {
        if (!(character instanceof Character)) {
            throw new GameError("Invalid character object");
        }
        if (this.characters.length >= Player.MAX_CHARACTERS) {
            throw new GameError(`Maximum character limit (${Player.MAX_CHARACTERS}) reached`);
        }
        character.validate();
        this.characters.push(character);
    }

    setDefendedCharacter(index) {
        if (!Number.isInteger(index) || index < -1 || index >= this.characters.length) {
            throw new GameError("Invalid defended character index");
        }
        if (index !== -1 && this.characters[index].isDisabled) {
            throw new GameError("Cannot defend with a disabled character");
        }
        this.defendedCharacterIndex = index;
    }

    clearDefense() {
        this.defendedCharacterIndex = -1;
    }

    validate() {
        if (!this.sessionId || typeof this.sessionId !== "string") {
            throw new GameError("Player sessionId must be a valid non-empty string");
        }
        if (this.defendedCharacterIndex < -1 || this.defendedCharacterIndex >= this.characters.length) {
            throw new GameError("Invalid defendedCharacterIndex");
        }
        this.characters.forEach(character => character.validate());
    }

    isDefeated() {
        return this.characters.every(character => character.isDisabled);
    }
}

class MyRoomState extends Schema {
    static MAX_PLAYERS = 2; // From the game logic, exactly 2 players
    static MIN_PLAYERS_TO_START = 2;

    constructor() {
        super();
        this.players = new MapSchema();
        this.turn = 0;
        this.countdown = 3;
        this.gameStarted = false;
        this.winner = "";
        this.worldType = WORLD_TYPES[0];
        this.gamePhase = GAME_PHASES.WAITING;
    }

    addPlayer(sessionId) {
        if (typeof sessionId !== "string" || !sessionId) {
            throw new GameError("Invalid sessionId");
        }
        if (this.players[sessionId]) {
            throw new GameError("Player with this sessionId already exists");
        }
        if (Object.keys(this.players).length >= MyRoomState.MAX_PLAYERS) {
            throw new GameError(`Maximum players (${MyRoomState.MAX_PLAYERS}) reached`);
        }
        const player = new Player();
        player.sessionId = sessionId;
        this.players[sessionId] = player;
    }

    removePlayer(sessionId) {
        if (!this.players[sessionId]) {
            throw new GameError("Player not found");
        }
        delete this.players[sessionId];
    }

    startGame() {
        const playerCount = Object.keys(this.players).length;
        if (playerCount < MyRoomState.MIN_PLAYERS_TO_START) {
            throw new GameError(`Need at least ${MyRoomState.MIN_PLAYERS_TO_START} players to start`);
        }
        if (Object.values(this.players).some(player => !player.ready)) {
            throw new GameError("All players must be ready to start the game");
        }
        this.gameStarted = true;
        this.countdown = 3;
        this.gamePhase = GAME_PHASES.PLAYING;
    }

    setWorldType(type) {
        if (!WORLD_TYPES.includes(type)) {
            throw new GameError("Invalid world type");
        }
        this.worldType = type;
    }

    nextTurn() {
        if (!this.gameStarted) {
            throw new GameError("Cannot advance turn before game starts");
        }
        const playerIds = Array.from(this.players.keys());
        this.turn = (this.turn + 1) % playerIds.length;
        // Clear defense of previous player
        const prevPlayerId = playerIds[(this.turn - 1 + playerIds.length) % playerIds.length];
        const prevPlayer = this.players[prevPlayerId];
        if (prevPlayer) {
            prevPlayer.clearDefense();
        }
    }

    validate() {
        if (this.turn < 0 || this.turn >= Object.keys(this.players).length) {
            throw new GameError("Invalid turn value");
        }
        if (this.countdown < 0) {
            throw new GameError("Countdown cannot be negative");
        }
        if (!WORLD_TYPES.includes(this.worldType)) {
            throw new GameError("Invalid world type");
        }
        if (this.winner && !this.players[this.winner]) {
            throw new GameError("Winner must be a valid player sessionId");
        }
        if (!Object.values(GAME_PHASES).includes(this.gamePhase)) {
            throw new GameError("Invalid game phase");
        }
        Object.values(this.players).forEach(player => player.validate());
    }

    checkGameEnd() {
        for (const [playerId, player] of this.players.entries()) {
            if (player.isDefeated()) {
                const otherPlayerId = Array.from(this.players.keys()).find(id => id !== playerId);
                if (otherPlayerId) {
                    this.winner = otherPlayerId;
                    this.gamePhase = GAME_PHASES.ENDED;
                    return true;
                }
            }
        }
        return false;
    }
}

// Define schema types
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
    worldType: "string",
    gamePhase: "string"
});

// Export constants and classes
module.exports = {
    MyRoomState,
    Player,
    Character,
    GameError,
    WORLD_TYPES,
    EMO_TYPES,
    RARITY_TYPES,
    GAME_PHASES
};