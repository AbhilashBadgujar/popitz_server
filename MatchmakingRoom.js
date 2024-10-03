const { Room } = require("colyseus");
const { MyRoom } = require("./MyRoom");

class MatchmakingRoom extends Room {
  onCreate(options) {
    this.maxClients = 50; // Adjust as needed
    this.waitingPlayers = [];
  }

  onJoin(client) {
    this.waitingPlayers.push(client);
    console.log(`Player ${client.sessionId} joined matchmaking. Waiting players: ${this.waitingPlayers.length}`);

    if (this.waitingPlayers.length >= 2) {
      const player1 = this.waitingPlayers.shift();
      const player2 = this.waitingPlayers.shift();
      this.createGame(player1, player2);
    }
  }

  async createGame(player1, player2) {
    try {
      const gameRoom = await this.gameServer.create("game", {});
      player1.send("gameReady", { roomId: gameRoom.roomId });
      player2.send("gameReady", { roomId: gameRoom.roomId });
    } catch (error) {
      console.error("Error creating game room:", error);
      this.waitingPlayers.unshift(player1, player2);
    }
  }

  onLeave(client) {
    this.waitingPlayers = this.waitingPlayers.filter(player => player !== client);
    console.log(`Player ${client.sessionId} left matchmaking. Waiting players: ${this.waitingPlayers.length}`);
  }
}

module.exports = { MatchmakingRoom };