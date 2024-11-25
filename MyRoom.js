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
    this.cardData = loadCardData();

    this.onMessage("selectCards", (client, message) => {
      this.handleCardSelection(client, message);
    });

    this.onMessage("attack", (client, message) => {
      this.handleAttack(client, message);
    });

    this.onMessage("defend", (client, message) => {
      this.handleDefend(client, message);
    });
  }

  onJoin(client, options) {
    console.log(`Player joining: ${client.sessionId}`);
    
    const newPlayer = new Player();
    newPlayer.sessionId = client.sessionId;
    this.state.players.set(client.sessionId, newPlayer);

    console.log(`Player joined: ${client.sessionId}`);
    console.log(`Total players: ${this.state.players.size}`);

    // Send all cards to the client for selection
    client.send("allCards", this.cardData);

    if (this.state.players.size === 2) {
      this.startCardSelection();
    }
  }

  startCardSelection() {
    console.log("Starting card selection phase");
    this.state.gamePhase = "cardSelection";
    this.broadcast("startCardSelection");
  }

  handleCardSelection(client, message) {
    const player = this.state.players.get(client.sessionId);

    if (!player || player.ready) {
      console.log(`Player ${client.sessionId} already selected cards. Ignoring duplicate selection.`);
      return;
    }

    console.log(`Received card selection from ${client.sessionId}:`, message.cardIds);
    if (message.cardIds && message.cardIds.length === 3) {
      message.cardIds.forEach(cardId => {
        const cardData = this.cardData.find(card => card.id === cardId);
        if (cardData) {
          const character = new Character(
            cardData.id,
            cardData.name,
            cardData.power,
            cardData.emo,
            cardData.rarity,
            cardData.defense,
            cardData.type,
            cardData.mojo
          );
          player.characters.push(character);
        }
      });

      console.log(`Player ${client.sessionId} has completed their card selection.`);

      player.cardSelectionReady = true;

      if (this.allPlayersReadyForCardSelection()) {
        this.startCharacterPlacement();
      }
    } else {
      console.log(`Invalid card selection from ${client.sessionId}`);
    }
  }

  allPlayersReadyForCardSelection() {
    return Array.from(this.state.players.values()).every(player => player.cardSelectionReady);
  }

  startCharacterPlacement() {
    console.log("Starting character placement phase");
    this.state.gamePhase = "characterPlacement";
    this.broadcast("startCharacterPlacement");
  }

  handleCharacterPlacement(client, message) {
    const player = this.state.players.get(client.sessionId);

    if (!player || player.readyForPlacement) {
      console.log(`Player ${client.sessionId} has already placed characters or is not valid. Ignoring placement.`);
      return;
    }

    if (message.positions && message.positions.length === 3) {
      for (let i = 0; i < message.positions.length; i++) {
        const character = player.characters[i];
        if (character) {
          character.position = message.positions[i];
        }
      }

      player.readyForPlacement = true;
      console.log(`Player ${client.sessionId} has completed character placement.`);

      if (this.allPlayersReadyForPlacement()) {
        this.startGame();
      }
    } else {
      console.log(`Invalid character placement from ${client.sessionId}`);
    }
  }

  allPlayersReadyForPlacement() {
    return Array.from(this.state.players.values()).every(player => player.readyForPlacement);
  }
  


  /* allPlayersReady() {
    return Array.from(this.state.players.values()).every(player => player.ready);
  }
 */
  startGame() {
    console.log("Starting the game!");
    this.state.gameStarted = true;

    this.countdown = 3;
    // Set a random world type
    this.state.worldType = WORLD_TYPES[Math.floor(Math.random() * WORLD_TYPES.length)];
    console.log(`World type set to: ${this.state.worldType}`);

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
    }, 100000);
  }

  checkEmptyRoom() {
    if (this.state.players.size === 0) {
      console.log(`Room ${this.roomId} is empty. Disposing in 60 seconds if it remains empty.`);
      this.clock.setTimeout(() => {
        if (this.state.players.size === 0) {
          console.log(`Disposing empty room ${this.roomId}`);
          this.disconnect();
        }
      }, 60000); // 60 seconds
    }
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
    if (!this.state.winner) {
      this.endTurn();
    }
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
    this.checkGameEnd();
    if (!this.state.winner) {
      this.endTurn();
    }

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
    let allPlayersLost = true;
  
    for (const [playerId, player] of this.state.players.entries()) {
      const allCharactersDead = player.characters.every(character => character.health <= 0);
      
      if (!allCharactersDead) {
        allPlayersLost = false;
      } else {
        // This player has lost
        const winnerId = Array.from(this.state.players.keys()).find(id => id !== playerId);
        this.state.winner = winnerId;
        this.broadcast("gameEnd", { winner: winnerId });
        
        // No need to continue checking if we've found a winner
        break;
      }
    }
  
    if (allPlayersLost) {
      // If all players have lost, it's a draw
      this.broadcast("gameEnd", { winner: null, result: "draw" });
    }
  
    if (this.state.winner || allPlayersLost) {
      // End the game and destroy the room
      this.clock.setTimeout(() => {
        console.log(`Game ended. Destroying room ${this.roomId}`);
        this.disconnect();
      }, 5000); // Give clients 5 seconds to receive the gameEnd message before destroying the room
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

  onDispose() {
    console.log(`Room ${this.roomId} disposing...`);
  }
}

module.exports = { MyRoom };