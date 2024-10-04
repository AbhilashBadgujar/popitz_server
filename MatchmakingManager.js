// MatchmakingManager.js
const { Client } = require("colyseus");

class MatchmakingManager {
  constructor(gameServer) {
    this.gameServer = gameServer;
    this.queue = [];
  }

  addToQueue(client, options) {
    this.queue.push({ client, options });
    console.log(`Added client ${client.sessionId} to queue. Queue size: ${this.queue.length}`);
    this.checkQueue(client);
  }

  handleDisconnect(client) {
    const index = this.queue.findIndex(item => item.client === client);
    if (index !== -1) {
      this.queue.splice(index, 1);
      console.log(`Removed disconnected client ${client.sessionId} from queue. Queue size: ${this.queue.length}`);
    }
  }

  async checkQueue(newClient) {
    // Attempt to find a match for the newly added client
    if (this.queue.length >= 2) {
      const player1 = this.queue.shift();
      const player2 = this.queue.shift();

      console.log(`Creating game room for ${player1.client.sessionId} and ${player2.client.sessionId}`);

      try {
        // Create a new room instance
        const room = await this.gameServer.createRoom("my_room", { 
          // Pass any necessary options here
          player1: player1.options, 
          player2: player2.options 
        });

        // Send room details to both clients
        player1.client.send("match_found", { roomId: room.roomId });
        player2.client.send("match_found", { roomId: room.roomId });

        console.log(`Created game room ${room.roomId} for clients ${player1.client.sessionId} and ${player2.client.sessionId}`);
      } catch (error) {
        console.error("Error creating game room:", error);
        // If room creation fails, re-add players to the queue
        this.queue.unshift(player2, player1);
      }
    }
  }
}

module.exports = { MatchmakingManager };
