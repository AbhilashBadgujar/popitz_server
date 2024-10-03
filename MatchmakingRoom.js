const { Room } = require("colyseus");
const { MyRoom } = require("./MyRoom");

class MatchmakingRoom extends Room {
  onCreate(options) {
    this.maxClients = 50; // Adjust as needed
    this.waitingPlayers = [];
    this.gameServer = options.gameServer;
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
      const gameRoom = await this.createRoom("game", MyRoom);
      await player1.send("gameReady", { roomId: gameRoom.roomId });
      await player2.send("gameReady", { roomId: gameRoom.roomId });
      console.log(`Game room created: ${gameRoom.roomId}`);
    } catch (error) {
      console.error("Error creating game room:", error);
      this.waitingPlayers.unshift(player1, player2);
    }
  }

  async createRoom(roomName, RoomClass) {
    const room = await this.gameServer.define(roomName, RoomClass).create();
    return room;
  }

  onLeave(client) {
    this.waitingPlayers = this.waitingPlayers.filter(player => player !== client);
    console.log(`Player ${client.sessionId} left matchmaking. Waiting players: ${this.waitingPlayers.length}`);
  }
}

module.exports = { MatchmakingRoom };