class MatchmakingManager {
  constructor(gameServer) {
    this.gameServer = gameServer;
    this.queue = [];
  }

  addToQueue(client, options) {
    this.queue.push({ client, options });
    console.log(`Added client ${client.sessionId} to queue. Queue size: ${this.queue.length}`);
    this.checkQueue();
  }

  handleDisconnect(client) {
    const index = this.queue.findIndex(item => item.client === client);
    if (index !== -1) {
      this.queue.splice(index, 1);
      console.log(`Removed disconnected client ${client.sessionId} from queue. Queue size: ${this.queue.length}`);
    }
  }

  async checkQueue() {
    if (this.queue.length >= 2) {
      const player1 = this.queue.shift();
      const player2 = this.queue.shift();
      
      try {
        const room = await this.gameServer.create("game", {});
        await room.send(player1.client, "match_found", { roomId: room.roomId });
        await room.send(player2.client, "match_found", { roomId: room.roomId });
        console.log(`Created game room ${room.roomId} for clients ${player1.client.sessionId} and ${player2.client.sessionId}`);
      } catch (error) {
        console.error("Error creating game room:", error);
        // Put players back in queue if room creation fails
        this.queue.unshift(player2, player1);
      }
    }
  }
}

module.exports = { MatchmakingManager };