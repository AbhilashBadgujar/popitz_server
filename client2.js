const Colyseus = require("colyseus.js");

const client = new Colyseus.Client("ws://localhost:2567");

async function runClient() {
  try {
    console.log("Client: Connecting to the server...");
    const room = await client.joinOrCreate("my_room");
    console.log("Client: Successfully joined the room");

    // Store the client's characters
    let myCharacters = [];
    let activeCharacterIndices = [0, 1, 2];

    room.onMessage("start", (message) => {
      console.log(`Client: Game is starting! Countdown: ${message.countdown}, World Type: ${message.worldType}`);
      
      // Log the client's characters
      myCharacters = room.state.players.get(room.sessionId).characters;
      console.log("Client: My characters:");
      myCharacters.forEach((char, index) => {
        console.log(`Character ${index}: Power: ${char.power}, Emo: ${char.emo}, Rarity: ${char.rarity}, Defense: ${char.defense} - ${char.type}`);
      });
    });

    room.onMessage("countdown", (message) => {
      console.log("Client: Countdown:", message.countdown);
    });

    room.onMessage("turn", (message) => {
      if (message.playerSessionId === room.sessionId) {
        console.log("Client: It's my turn!");
        // Autoplay: randomly choose between attack and defend
        setTimeout(() => {
          if (activeCharacterIndices.length === 0) {
            console.log("Client: No active characters left. Cannot perform any action.");
            room.send("endTurn");
            return;
          }

          if (Math.random() < 0.7) {  // 70% chance to attack
            const fromCharacterIndex = activeCharacterIndices[Math.floor(Math.random() * activeCharacterIndices.length)];
            const toCharacterIndex = Math.floor(Math.random() * 3);  // Assuming opponent might have all characters active
            room.send("attack", { fromCharacterIndex, toCharacterIndex });
            const attackingChar = myCharacters[fromCharacterIndex];
            console.log(`Client: Attacked opponent's character ${toCharacterIndex} with my character ${fromCharacterIndex}`);
            console.log(`Attacking character - Type: ${attackingChar.type}, Power: ${attackingChar.power}, Emo: ${attackingChar.emo}, Rarity: ${attackingChar.rarity}, Defense: ${attackingChar.defense}`);
          } else {  // 30% chance to defend
            const characterIndex = activeCharacterIndices[Math.floor(Math.random() * activeCharacterIndices.length)];
            room.send("defend", { characterIndex });
            const defendingChar = myCharacters[characterIndex];
            console.log(`Client: Defended my character ${characterIndex}`);
            console.log(`Defending character - Type: ${defendingChar.type}, Power: ${defendingChar.power}, Emo: ${defendingChar.emo}, Rarity: ${defendingChar.rarity}, Defense: ${defendingChar.defense}`);
          }
        }, 1000);
      } else {
        console.log("Client: It's the opponent's turn");
      }
    });

    room.onMessage("updateHealth", (message) => {
      console.log(`Client: Character ${message.characterIndex} health updated to ${message.health}`);
      if (message.playerId === room.sessionId) {
        myCharacters[message.characterIndex].health = message.health;
      }
    });

    room.onMessage("characterDisabled", (message) => {
      console.log(`Client: Character ${message.characterIndex} has been disabled`);
      if (message.playerId === room.sessionId) {
        myCharacters[message.characterIndex].isDisabled = true;
        activeCharacterIndices = activeCharacterIndices.filter(index => index !== message.characterIndex);
        console.log(`Client: Active characters remaining: ${activeCharacterIndices.join(', ')}`);
      }
    });

    room.onMessage("defenseExpired", (message) => {
      console.log(`Client: Defense expired for player ${message.playerId}, character ${message.characterIndex}`);
    });

    room.onMessage("characterDefended", (message) => {
      console.log(`Client: Player ${message.playerId} defended character ${message.characterIndex}`);
    });

    room.onMessage("attackBlocked", (message) => {
      console.log(`Client: Attack blocked! Attacker: ${message.attackerId}, Defender: ${message.defenderId}, Defended Character: ${message.characterIndex}`);
    });

    room.onMessage("gameEnd", (message) => {
      console.log(`Client: Game ended. Winner: ${message.winner}`);
      process.exit(0);
    });

    room.onLeave((code) => {
      console.log("Client: Left the room", code);
      process.exit(0);
    });

  } catch (error) {
    console.error("Client: Error:", error);
  }
}

runClient();