const colyseus = require("colyseus");
const http = require("http");
const { MyRoom } = require("./MyRoom");

const port = process.env.PORT || 2567;
const gameServer = new colyseus.Server({
  server: http.createServer()
});

// Register the room handler
gameServer.define('my_room', MyRoom);

// Listen on the specified port
gameServer.listen(port);
console.log(`Game server is listening on ws://localhost:${port}`);