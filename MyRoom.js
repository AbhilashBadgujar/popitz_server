const { Room } = require("colyseus");
const { MyRoomState, Player, Card } = require("./MyRoomState");

class MyRoom extends Room {
  onCreate(options) {
    console.log("Room created!");
    this.setState(new MyRoomState());
    this.maxClients = 2;
    this.countdown = 3;
    this.turnOrder = []; // To keep track of player turn order

    this.onMessage("attack", (client, message) => {
      this.handleAttack(client, message);
    });

    this.onMessage("defend", (client, message) => {
      this.handleDefend(client, message);
    });
  }

  onJoin(client, options) {
    console.log(`Attempt to join: ${client.sessionId}`);
    console.log(`Current players: ${JSON.stringify(Array.from(this.state.players.keys()))}`);
    
    if (!this.state.players.has(client.sessionId)) {
      const newPlayer = new Player();
      
      // Initialize cards for the new player
      for (let i = 0; i < 3; i++) {
        const card = new Card();
        card.health = 20;
        card.isDisabled = false;
        newPlayer.cards[i] = card;
      }
  
      this.state.players.set(client.sessionId, newPlayer);
  
      console.log(`Player joined: ${client.sessionId}`);
      console.log(`Updated players: ${JSON.stringify(Array.from(this.state.players.keys()))}`);
      console.log(`Total players: ${this.state.players.size}`);
  
      if (this.state.players.size === 2) {
        this.startGame();
      }
    } else {
      console.log(`Player ${client.sessionId} already exists in the room.`);
    }
  }


  onLeave(client, consented) {
    console.log(`Player leaving: ${client.sessionId}`);
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId);
      console.log(`Player left: ${client.sessionId}. Total players: ${this.state.players.size}`);
      
      if (this.state.gameStarted && this.state.players.size < 2) {
        this.endGame();
      }
    } else {
      console.log(`Attempted to remove non-existent player: ${client.sessionId}`);
    }
    console.log(`Remaining players: ${JSON.stringify(Array.from(this.state.players.keys()))}`);
  }

  startGame() {
    console.log("Starting the game!");
    this.state.gameStarted = true;

    this.broadcast("start", { countdown: this.countdown });
    console.log("Broadcasting start message with countdown 3");

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

    // Check if defense has expired for the current player
    const currentPlayer = this.state.players.get(currentPlayerSessionId);
    if (currentPlayer.defendedCardIndex !== -1) {
      const expiredCardIndex = currentPlayer.defendedCardIndex;
      currentPlayer.defendedCardIndex = -1;
      this.broadcast("defenseExpired", { playerId: currentPlayerSessionId, cardIndex: expiredCardIndex });
      console.log(`Defense expired for player ${currentPlayerSessionId}, card ${expiredCardIndex}`);
    }

    // Clear any existing turn timeout
    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout);
    }

    // Set a new turn timeout (e.g., 30 seconds)
    this.turnTimeout = setTimeout(() => {
      console.log(`Turn timeout for player: ${currentPlayerSessionId}`);
      this.endTurn();
    }, 30000);
  }

  handleAttack(client, message) {
    const currentPlayerSessionId = this.turnOrder[this.state.turn];
    if (client.sessionId !== currentPlayerSessionId) return;

    const { fromCardIndex, toCardIndex } = message;
    const attacker = this.state.players.get(client.sessionId);
    const defenderId = this.turnOrder.find(id => id !== client.sessionId);
    const defender = this.state.players.get(defenderId);

    if (fromCardIndex >= 0 && fromCardIndex < attacker.cards.length &&
        toCardIndex >= 0 && toCardIndex < defender.cards.length) {
      
      const attackingCard = attacker.cards[fromCardIndex];
      const targetCard = defender.cards[toCardIndex];

      if (attackingCard.isDisabled || targetCard.isDisabled) {
        console.log("Cannot attack with or target a disabled card");
        return;
      }

      if (defender.defendedCardIndex === toCardIndex) {
        console.log(`Attack blocked on defended card ${toCardIndex}`);
        this.broadcast("attackBlocked", { attackerId: client.sessionId, defenderId: defenderId, cardIndex: toCardIndex });
      } else {
        // Perform the attack
        targetCard.health = Math.max(0, targetCard.health - 20);
        if (targetCard.health === 0) {
          targetCard.isDisabled = true;
          this.broadcast("cardDisabled", { playerId: defenderId, cardIndex: toCardIndex });
        }
        console.log(`Player ${client.sessionId} attacked card ${toCardIndex} of player ${defenderId}`);
        this.broadcast("updateHealth", { playerId: defenderId, cardIndex: toCardIndex, health: targetCard.health });
      }
    } else {
      console.error(`Invalid attack: fromCardIndex=${fromCardIndex}, toCardIndex=${toCardIndex}`);
    }

    this.checkGameEnd();
    this.endTurn();
  }

  handleDefend(client, message) {
    const currentPlayerSessionId = this.turnOrder[this.state.turn];
    if (client.sessionId !== currentPlayerSessionId) return;

    const { cardIndex } = message;
    const defender = this.state.players.get(client.sessionId);

    if (cardIndex >= 0 && cardIndex < defender.cards.length) {
      if (defender.cards[cardIndex].isDisabled) {
        console.log("Cannot defend with a disabled card");
        return;
      }
      defender.defendedCardIndex = cardIndex;
      console.log(`Player ${client.sessionId} is defending card ${cardIndex}`);
      this.broadcast("cardDefended", { playerId: client.sessionId, cardIndex: cardIndex });
    } else {
      console.error(`Invalid defend: cardIndex=${cardIndex}`);
    }

    this.endTurn();
  }



  
  endTurn() {
    // Ensure there are still players in the turn order
    if (this.turnOrder.length === 0) {
      console.log("No players left to assign turn to.");
      return;
    }
  
    // Move to the next turn safely
    this.state.turn = (this.state.turn + 1) % this.turnOrder.length;
    this.assignTurn();
  }
  
  checkGameEnd() {
    for (const [playerId, player] of this.state.players.entries()) {
      if (player.cards.every(card => card.isDisabled)) {
        const winnerId = Array.from(this.state.players.keys()).find(id => id !== playerId);
        this.state.winner = winnerId;
        this.broadcast("gameEnd", { winner: winnerId });
        return;
      }
    }
  }

  endGame(reason = "Game ended") {
    console.log(`Game ended: ${reason}`);
    this.state.gameStarted = false;
    this.state.winner = reason === "Player disconnected" ? null : this.state.winner;

    // Broadcast the game end message to all clients
    this.broadcast("gameEnd", { reason: reason, winner: this.state.winner });

    // Disconnect all clients
    this.clients.forEach(client => {
      client.leave();
    });

    // Close the room after a short delay to ensure all messages are sent
    setTimeout(() => {
      this.disconnect();
    }, 1000);
  }

  onLeave(client, consented) {
    console.log(`Player leaving: ${client.sessionId}`);
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId);
      this.turnOrder = this.turnOrder.filter(id => id !== client.sessionId); // Update turn order
      console.log(`Player left: ${client.sessionId}. Total players: ${this.state.players.size}`);
  
      if (this.state.gameStarted && this.state.players.size < 2) {
        this.endGame("Player disconnected");
      }
    } else {
      console.log(`Attempted to remove non-existent player: ${client.sessionId}`);
    }
    console.log(`Remaining players: ${JSON.stringify(Array.from(this.state.players.keys()))}`);
  }
  

}

module.exports = { MyRoom };
