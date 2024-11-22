const colyseus = require("colyseus");
const express = require("express");
const http = require("http");
const { WebSocketTransport } = require("@colyseus/ws-transport");
const { MyRoom } = require("./MyRoom");
const { MatchmakingManager } = require("./MatchmakingManager");

// Environment variables
const port = process.env.PORT || 2567;
const isDevelopment = process.env.NODE_ENV !== 'production';

const app = express();

app.get("/", (req, res) => {
  res.send("Colyseus server is running.");
});

const server = http.createServer(app);

const gameServer = new colyseus.Server({
  transport: new WebSocketTransport({
    server: server,
    pingInterval: 2000,
    pingMaxRetries: 5,
  })
});

// Initialize the Matchmaking Manager
const matchmakingManager = new MatchmakingManager(gameServer);

// Define your matchmaking room
class MatchmakingRoom extends colyseus.Room {
  onCreate(options) {
    this.onMessage("find_match", (client, options) => {
      console.log(`Client ${client.sessionId} requesting to find a match`);
      matchmakingManager.addToQueue(client, options);
    });
  }

  onLeave(client) {
    console.log(`Client ${client.sessionId} disconnected`);
    matchmakingManager.handleDisconnect(client);
  }
}

// Define your rooms
gameServer.define("matchmaking", MatchmakingRoom);
gameServer.define("game", MyRoom);

console.log("Starting server...");

if (isDevelopment) {
  // For local development
  server.listen(port, 'localhost', () => {
    console.log(`Game server is listening on ws://localhost:${port}`);
  });
} else {
  // For production deployment
  server.listen(port, '0.0.0.0', () => {
    console.log(`Game server is listening on ws://0.0.0.0:${port}`);
  });
}

console.log(`Server started in ${isDevelopment ? 'development' : 'production'} mode!`);