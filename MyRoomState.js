const schema = require('@colyseus/schema');
const { Schema, MapSchema, ArraySchema, type } = schema;

class Card extends Schema {
  constructor() {
    super();
    this.health = 20;
    this.isDisabled = false;
  }
}

class Player extends Schema {
  constructor() {
    super();
    this.cards = new ArraySchema(new Card(), new Card(), new Card());
    this.defendedCardIndex = -1;
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
  }
}

schema.defineTypes(Card, {
  health: "uint16",
  isDisabled: "boolean"
});

schema.defineTypes(Player, {
  cards: [Card],
  defendedCardIndex: "int8",
  sessionId: "string"
});

schema.defineTypes(MyRoomState, {
  players: { map: Player },
  turn: "uint8",
  countdown: "uint8",
  gameStarted: "boolean",
  winner: "string"
});

module.exports = { MyRoomState, Player, Card };