const { Room } = require("colyseus");
const { MyRoomState, Player, Character } = require("./MyRoomState");
const loadCardData = require("./loadCardData");
const { getTypeMultiplier, getWorldTypeMultiplier } = require("./typeChart");

const WORLD_TYPES = ["city", "forest", "water"];
const CARD_DATA = loadCardData();

const EMO_BONUS = {
  Happiness: 1.2,
  Sadness: 0.9,
  Anger: 1.3,
  Fear: 0.8,
  Surprise: 1.1,
  Disgust: 1.0,
  Love: 1.2,
  Curiosity: 1.1
};
const RARITY_BONUS = {
  Common: 1,
  Rare: 1.2,
  Legendary: 1.5
};
class MyRoom extends Room {
  onCreate(options) {
    console.log("Room created!");
    this.setState(new MyRoomState());
    this.maxClients = 2;
    this.countdown = 3;
    this.turnOrder = [];
    this.cardData = loadCardData();

    if (this.cardData.length === 0) {
      console.error("Failed to load card data. Room creation aborted.");
      return;
    }

    // Set a random world type
    this.state.worldType = WORLD_TYPES[Math.floor(Math.random() * WORLD_TYPES.length)];
    console.log(`World type set to: ${this.state.worldType}`);

    this.onMessage("attack", (client, message) => {
      this.handleAttack(client, message);
    });

    this.onMessage("defend", (client, message) => {
      this.handleDefend(client, message);
    });
  }


  onJoin(client, options) {
    console.log(`Player joining: ${client.sessionId}`);
    
    if (!this.state.players.has(client.sessionId)) {
      const newPlayer = new Player();
      newPlayer.sessionId = client.sessionId;
      
      // Create 3 random characters for the player
      for (let i = 0; i < 3; i++) {
        const randomCardData = CARD_DATA[Math.floor(Math.random() * CARD_DATA.length)];
        const character = new Character(
          randomCardData.id,
          randomCardData.power,
          randomCardData.emo,
          randomCardData.rarity,
          randomCardData.defense,
          randomCardData.type
        );
        newPlayer.characters.push(character);
      }
  
      this.state.players.set(client.sessionId, newPlayer);
  
      console.log(`Player joined: ${client.sessionId}`);
      console.log(`Total players: ${this.state.players.size}`);
  
      if (this.state.players.size === 2) {
        this.startGame();
      }
    } else {
      console.log(`Player ${client.sessionId} already exists in the room.`);
    }
  }

  startGame() {
    console.log("Starting the game!");
    this.state.gameStarted = true;

    this.broadcast("start", { countdown: this.countdown, worldType: this.state.worldType });
    console.log(`Broadcasting start message with countdown ${this.countdown} and world type ${this.state.worldType}`);

    const countdownInterval = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
        this.state.countdown = this.countdown;
        this.broadcast("countdown", { countdown: this.countdown });
        console.log(`Countdown: ${this.countdown}`);
      } else {
        clearInterval(countdownInterval);
        this.startFirstTurn();
      }
    }, 1000);
  }

  startFirstTurn() {
    this.turnOrder = Array.from(this.state.players.keys());
    this.state.turn = Math.floor(Math.random() * this.turnOrder.length);
    this.assignTurn();
  }

  assignTurn() {
    const currentPlayerSessionId = this.turnOrder[this.state.turn];
    this.broadcast("turn", { playerSessionId: currentPlayerSessionId });
    console.log(`Turn assigned to player: ${currentPlayerSessionId}`);

    const currentPlayer = this.state.players.get(currentPlayerSessionId);
    if (currentPlayer.defendedCharacterIndex !== -1) {
      const expiredCharacterIndex = currentPlayer.defendedCharacterIndex;
      currentPlayer.defendedCharacterIndex = -1;
      this.broadcast("defenseExpired", { playerId: currentPlayerSessionId, characterIndex: expiredCharacterIndex });
      console.log(`Defense expired for player ${currentPlayerSessionId}, character ${expiredCharacterIndex}`);
    }

    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout);
    }

    this.turnTimeout = setTimeout(() => {
      console.log(`Turn timeout for player: ${currentPlayerSessionId}`);
      this.endTurn();
    }, 30000);
  }

  handleAttack(client, message) {
    const currentPlayerSessionId = this.turnOrder[this.state.turn];
    if (client.sessionId !== currentPlayerSessionId) return;

    const { fromCharacterIndex, toCharacterIndex } = message;
    const attacker = this.state.players.get(client.sessionId);
    const defenderId = this.turnOrder.find(id => id !== client.sessionId);
    const defender = this.state.players.get(defenderId);

    if (fromCharacterIndex >= 0 && fromCharacterIndex < attacker.characters.length &&
        toCharacterIndex >= 0 && toCharacterIndex < defender.characters.length) {
      
      const attackingCharacter = attacker.characters[fromCharacterIndex];
      const targetCharacter = defender.characters[toCharacterIndex];

      if (attackingCharacter.isDisabled || targetCharacter.isDisabled) {
        console.log("Cannot attack with or target a disabled character");
        return;
      }

      if (defender.defendedCharacterIndex === toCharacterIndex) {
        console.log(`Attack blocked on defended character ${toCharacterIndex}`);
        this.broadcast("attackBlocked", { attackerId: client.sessionId, defenderId: defenderId, characterIndex: toCharacterIndex });
      } else {
        // Calculate damage based on power, type advantages, world type, emo, rarity, and mojo
        const baseDamage = attackingCharacter.power;
        const typeMultiplier = getTypeMultiplier(attackingCharacter.type, targetCharacter.type);
        const worldTypeMultiplier = getWorldTypeMultiplier(attackingCharacter.type, this.state.worldType);
        const emoBonus = EMO_BONUS[attackingCharacter.emo];
        const rarityBonus = RARITY_BONUS[attackingCharacter.rarity];
        const mojoChance = Math.random() < (attackingCharacter.mojo / 10);
        
        let damage = baseDamage * typeMultiplier * worldTypeMultiplier * emoBonus * rarityBonus;
        if (mojoChance) {
          damage *= 2;
          console.log("Mojo activated! Double damage!");
        }
        
        // Apply defense reduction
        const defenseReduction = targetCharacter.defense / 100; // Convert defense to a percentage
        damage *= (1 - defenseReduction);
        
        damage = Math.floor(damage);

        targetCharacter.health = Math.max(0, targetCharacter.health - damage);
        if (targetCharacter.health === 0) {
          targetCharacter.isDisabled = true;
          this.broadcast("characterDisabled", { playerId: defenderId, characterIndex: toCharacterIndex });
        }
        console.log(`Player ${client.sessionId} attacked character ${toCharacterIndex} of player ${defenderId} for ${damage} damage`);
        this.broadcast("updateHealth", { playerId: defenderId, characterIndex: toCharacterIndex, health: targetCharacter.health });
        
        // Broadcast attack details
        this.broadcast("attackDetails", {
          attackerId: client.sessionId,
          defenderId: defenderId,
          fromCharacterIndex: fromCharacterIndex,
          toCharacterIndex: toCharacterIndex,
          damage: damage,
          typeMultiplier: typeMultiplier,
          worldTypeMultiplier: worldTypeMultiplier,
          emoBonus: emoBonus,
          rarityBonus: rarityBonus,
          mojoActivated: mojoChance
        });
      }
    } else {
      console.error(`Invalid attack: fromCharacterIndex=${fromCharacterIndex}, toCharacterIndex=${toCharacterIndex}`);
    }

    this.checkGameEnd();
    this.endTurn();
  }

  handleDefend(client, message) {
    const currentPlayerSessionId = this.turnOrder[this.state.turn];
    if (client.sessionId !== currentPlayerSessionId) return;

    const { characterIndex } = message;
    const defender = this.state.players.get(client.sessionId);

    if (characterIndex >= 0 && characterIndex < defender.characters.length) {
      if (defender.characters[characterIndex].isDisabled) {
        console.log("Cannot defend with a disabled character");
        return;
      }
      defender.defendedCharacterIndex = characterIndex;
      console.log(`Player ${client.sessionId} is defending character ${characterIndex}`);
      this.broadcast("characterDefended", { playerId: client.sessionId, characterIndex: characterIndex });
    } else {
      console.error(`Invalid defend: characterIndex=${characterIndex}`);
    }

    this.endTurn();
  }

  endTurn() {
    if (this.turnOrder.length === 0) {
      console.log("No players left to assign turn to.");
      return;
    }
  
    this.state.turn = (this.state.turn + 1) % this.turnOrder.length;
    this.assignTurn();
  }
  
  checkGameEnd() {
    for (const [playerId, player] of this.state.players.entries()) {
      if (player.characters.every(character => character.isDisabled)) {
        const winnerId = Array.from(this.state.players.keys()).find(id => id !== playerId);
        this.state.winner = winnerId;
        this.broadcast("gameEnd", { winner: winnerId });
        return;
      }
    }
  }

  onLeave(client, consented) {
    console.log(`Player leaving: ${client.sessionId}`);
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId);
      this.turnOrder = this.turnOrder.filter(id => id !== client.sessionId);
      console.log(`Player left: ${client.sessionId}. Total players: ${this.state.players.size}`);
  
      if (this.state.gameStarted && this.state.players.size < 2) {
        this.endGame("Player disconnected");
      }
    } else {
      console.log(`Attempted to remove non-existent player: ${client.sessionId}`);
    }
    console.log(`Remaining players: ${JSON.stringify(Array.from(this.state.players.keys()))}`);
  }

  endGame(reason = "Game ended") {
    console.log(`Game ended: ${reason}`);
    this.state.gameStarted = false;
    this.state.winner = reason === "Player disconnected" ? null : this.state.winner;

    this.broadcast("gameEnd", { reason: reason, winner: this.state.winner });

    this.clients.forEach(client => {
      client.leave();
    });

    setTimeout(() => {
      this.disconnect();
    }, 1000);
  }
}

module.exports = { MyRoom };