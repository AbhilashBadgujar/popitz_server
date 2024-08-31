const colyseus = require("colyseus");
const http = require("http");
const { MyRoom } = require("./MyRoom");

const port = process.env.PORT || 2567;
const gameServer = new colyseus.Server({
  server: http.createServer()
});

// Register the room handler
gameServer.define('my_room', MyRoom);

// Listen on the specified port and all network interfaces
gameServer.listen(port, '0.0.0.0', () => {
  console.log(`Game server is listening on ws://0.0.0.0:${port}`);
});
