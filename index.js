const colyseus = require("colyseus");
const express = require("express");
const http = require("http");
const { WebSocketTransport } = require("@colyseus/ws-transport");
const { MyRoom } = require("./MyRoom");

// Use the port provided by Heroku
const port = process.env.PORT || 2567;

// Create an Express application
const app = express();

// Add a basic endpoint to handle HTTP requests
app.get("/", (req, res) => {
  res.send("Colyseus server is running.");
});

// Create an HTTP server using Express
const server = http.createServer(app);

// Initialize the Colyseus server with WebSocketTransport
const gameServer = new colyseus.Server({
  transport: new WebSocketTransport({
    server: server, // Attach the existing HTTP server
    pingInterval: 2000, // Set ping interval
    pingMaxRetries: 5,  // Set max ping retries
  })
});

// Define your room handler
gameServer.define('my_room', MyRoom);
console.log("Starting server...");
// Start the HTTP server on the specified port
server.listen(port, '0.0.0.0', () => {
  console.log(`Game server is listening on ws://0.0.0.0:${port}`);
});
console.log("Server started!");
