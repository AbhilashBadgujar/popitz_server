const colyseus = require("colyseus");
const http = require("http");
const express = require("express");
const { WebSocketTransport } = require("@colyseus/ws-transport");
const { MyRoom } = require("./MyRoom");

const port = process.env.PORT || 2567;

// Create an Express application
const app = express();

// Define a simple HTTP GET endpoint for health checks or basic responses
app.get("/", (req, res) => {
  res.send("Colyseus server is running.");
});

// Create the HTTP server using Express
const server = http.createServer(app);

// Initialize the Colyseus server with the WebSocketTransport
const gameServer = new colyseus.Server({
  transport: new WebSocketTransport({
    server: server, // Use the existing HTTP server
    pingInterval: 2000, // Example of setting ping interval
    pingMaxRetries: 5,  // Example of setting max retries
  })
});

// Register the room handler
gameServer.define('my_room', MyRoom);

// Start the HTTP server to listen on the specified port and all interfaces
server.listen(port, '0.0.0.0', () => {
  console.log(`Game server is listening on ws://0.0.0.0:${port}`);
});
