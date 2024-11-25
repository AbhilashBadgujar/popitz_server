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
  constructor(id, name, power, emo, rarity, defense, type, mojo) {
    super();
    this.id = id;
    this.name = name;
    this.power = power;
    this.emo = emo;
    this.rarity = rarity;
    this.defense = defense;
    this.type = type;
    this.mojo = mojo;
    this.health = 100;
    this.isDisabled = false;
  }
}

schema.defineTypes(Character, {
  id: "number",
  name: "string",
  power: "number",
  emo: "string",
  rarity: "string",
  defense: "number",
  type: "string",
  mojo: "number",
  health: "number",
  isDisabled: "boolean"
});

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
  constructor() {
    super();
    this.players = new MapSchema();
    this.turn = 0;
    this.countdown = 3;
    this.gameStarted = false;
    this.winner = "";
    this.worldType = "";
  }
}

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