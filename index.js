const colyseus = require("colyseus");
const express = require("express");
const http = require("http");
const { WebSocketTransport } = require("@colyseus/ws-transport");
const { MyRoom } = require("./MyRoom");
const { MatchmakingManager } = require("./MatchmakingManager");

const port = process.env.PORT || 2567;
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

// Define your room
gameServer.define("game", MyRoom);

// Initialize the Matchmaking Manager
const matchmakingManager = new MatchmakingManager(gameServer);

// Handle matchmaking requests
gameServer.onConnection((client) => {
  client.onMessage("find_match", (options) => {
    console.log(`Client ${client.sessionId} requesting to find a match`);
    matchmakingManager.addToQueue(client, options);
  });

  // Handle client disconnection
  client.onLeave(() => {
    console.log(`Client ${client.sessionId} disconnected`);
    matchmakingManager.handleDisconnect(client);
  });
});

console.log("Starting server...");
server.listen(port, '0.0.0.0', () => {
  console.log(`Game server is listening on ws://0.0.0.0:${port}`);
});
console.log("Server started!");