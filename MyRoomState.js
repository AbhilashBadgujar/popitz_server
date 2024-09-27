const schema = require('@colyseus/schema');
const { Schema, MapSchema, ArraySchema, type } = schema;

class Character extends Schema {
  constructor(power, emo, rarity, defense, type) {
    super();
    this.power = power;
    this.emo = emo;
    this.rarity = rarity;
    this.defense = defense;
    this.type = type;
    this.health = 100;
    this.isDisabled = false;
  }
}

class Player extends Schema {
  constructor() {
    super();
    this.characters = new ArraySchema();
    this.defendedCharacterIndex = -1;
    this.sessionId = "";
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
  power: "number",
  emo: "number",
  rarity: "number",
  defense: "number",
  type: "string",
  health: "number",
  isDisabled: "boolean"
});

schema.defineTypes(Player, {
  characters: [Character],
  defendedCharacterIndex: "int8",
  sessionId: "string"
});

schema.defineTypes(MyRoomState, {
  players: { map: Player },
  turn: "uint8",
  countdown: "uint8",
  gameStarted: "boolean",
  winner: "string",
  worldType: "string"
});

module.exports = { MyRoomState, Player, Character };