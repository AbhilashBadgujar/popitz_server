const colyseus = require("colyseus");
const express = require("express");
const http = require("http");
const { WebSocketTransport } = require("@colyseus/ws-transport");
const { MyRoom } = require("./MyRoom");
const { MatchmakingRoom } = require("./MatchmakingRoom");

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

gameServer.define('matchmaking', MatchmakingRoom, { gameServer });
gameServer.define('game', MyRoom);  // Define the game room type

console.log("Starting server...");
server.listen(port, '0.0.0.0', () => {
  console.log(`Game server is listening on ws://0.0.0.0:${port}`);
});
console.log("Server started!");