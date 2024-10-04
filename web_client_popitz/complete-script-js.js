document.addEventListener('DOMContentLoaded', (event) => {
    const client = new Colyseus.Client('wss://popitz-server-4682fddc412a.herokuapp.com');
    let room;
    let myCharacters = [];
    let opponentCharacters = [];
    let selectedCharacterIndex = -1;
    let selectedOpponentCharacterIndex = -1;
    let isMyTurn = false;
    let allCards = [];
    let selectedCardIds = [];

    const startMatchmakingBtn = document.getElementById('start-matchmaking-btn');
    const matchmakingStatus = document.getElementById('matchmaking-status');
    const gameContent = document.getElementById('game-content');
    const cardSelection = document.getElementById('card-selection');
    const startGameBtn = document.getElementById('start-game-btn');

    startMatchmakingBtn.addEventListener('click', startMatchmaking);

    async function startMatchmaking() {
        startMatchmakingBtn.disabled = true;
        matchmakingStatus.textContent = "Searching for a match...";

        try {
            room = await client.joinOrCreate("game");
            console.log("Joined game room", room);
            setupRoomHandlers();
            gameContent.style.display = 'block';
            document.getElementById('matchmaking-container').style.display = 'none';
        } catch (e) {
            console.error("Error joining game room", e);
            matchmakingStatus.textContent = "Error finding a match. Please try again.";
            startMatchmakingBtn.disabled = false;
        }
    }
    
    document.getElementById('start-game-btn').addEventListener('click', () => {
        if (selectedCardIds.length === 3) {
            room.send("selectCards", { cardIds: selectedCardIds });
        }
    });
    async function joinGameRoom(roomId) {
        try {
            room = await client.joinById(roomId);
            console.log("Joined game room", room);
            setupRoomHandlers();
            gameContent.style.display = 'block';
            document.getElementById('matchmaking-container').style.display = 'none';
        } catch (e) {
            console.error("Error joining game room", e);
            matchmakingStatus.textContent = "Error joining game. Please try again.";
            startMatchmakingBtn.disabled = false;
        }
    }
    async function joinRoom() {
        try {
            room = await client.joinOrCreate("my_room");
            console.log("joined successfully", room);
            setupRoomHandlers();
        } catch (e) {
            console.error("join error", e);
        }
    }

    function setupRoomHandlers() {

        room.onMessage("allCards", (cards) => {
            allCards = cards;
            displayCardSelection();
        });

        room.onMessage("startCardSelection", () => {
            cardSelection.style.display = 'block';
            startGameBtn.style.display = 'block';
        });

        room.onMessage("start", (message) => {
            cardSelection.style.display = 'none';
            startGameBtn.style.display = 'none';
            document.getElementById('selection-info').style.display = 'none';
            log(`Game is starting! Countdown: ${message.countdown}, World Type: ${message.worldType}`);
            document.getElementById('world-info').innerText = `World Type: ${message.worldType}`;
        });

        room.onMessage("turn", (message) => {
            isMyTurn = message.playerSessionId === room.sessionId;
            document.getElementById('attack-btn').disabled = !isMyTurn;
            document.getElementById('defend-btn').disabled = !isMyTurn;
            log(isMyTurn ? "It's your turn!" : "It's the opponent's turn");
            updateCharacterDisplay();
        });

        room.onMessage("updateHealth", (message) => {
            log(`Character ${message.characterIndex} health updated to ${message.health}`);
            if (message.playerId === room.sessionId) {
                myCharacters[message.characterIndex].health = message.health;
            } else {
                opponentCharacters[message.characterIndex].health = message.health;
            }
            updateCharacterDisplay();
        });

        room.onMessage("characterDisabled", (message) => {
            log(`Character ${message.characterIndex} has been disabled`);
            if (message.playerId === room.sessionId) {
                myCharacters[message.characterIndex].isDisabled = true;
            } else {
                opponentCharacters[message.characterIndex].isDisabled = true;
            }
            updateCharacterDisplay();
        });

        room.onMessage("defenseExpired", (message) => {
            log(`Defense expired for player ${message.playerId}, character ${message.characterIndex}`);
        });

        room.onMessage("characterDefended", (message) => {
            log(`Player ${message.playerId} defended character ${message.characterIndex}`);
        });

        room.onMessage("attackBlocked", (message) => {
            log(`Attack blocked! Attacker: ${message.attackerId}, Defender: ${message.defenderId}, Defended Character: ${message.characterIndex}`);
        });

        room.onMessage("attackDetails", (message) => {
            const { attackerId, defenderId, fromCharacterIndex, toCharacterIndex, damage, typeMultiplier, worldTypeMultiplier, emoBonus, rarityBonus, mojoActivated } = message;
            const isAttacker = attackerId === room.sessionId;
            const attackerChar = isAttacker ? myCharacters[fromCharacterIndex] : opponentCharacters[fromCharacterIndex];
            const defenderChar = isAttacker ? opponentCharacters[toCharacterIndex] : myCharacters[toCharacterIndex];
            
            let detailsMessage = `${isAttacker ? 'Your' : 'Opponent\'s'} ${attackerChar.type} character attacked `;
            detailsMessage += `${isAttacker ? 'opponent\'s' : 'your'} ${defenderChar.type} character for ${damage} damage.\n`;
            detailsMessage += `Type effectiveness: x${typeMultiplier.toFixed(2)}\n`;
            detailsMessage += `World type bonus: x${worldTypeMultiplier.toFixed(2)}\n`;
            detailsMessage += `Emo bonus (${attackerChar.emo}): x${emoBonus.toFixed(2)}\n`;
            detailsMessage += `Rarity bonus (${attackerChar.rarity}): x${rarityBonus.toFixed(2)}\n`;
            if (mojoActivated) {
                detailsMessage += `Mojo activated! Double damage!\n`;
            }
            
            log(detailsMessage);
        });

        room.onMessage("gameEnd", (message) => {
            log(`Game ended. Winner: ${message.winner}`);
            document.getElementById('attack-btn').disabled = true;
            document.getElementById('defend-btn').disabled = true;
        });

        room.onStateChange((state) => {
            console.log("the room state has been updated:", state);
            const players = Array.from(state.players.values());
            const myPlayer = players.find(p => p.sessionId === room.sessionId);
            const opponentPlayer = players.find(p => p.sessionId !== room.sessionId);
            
            myCharacters = myPlayer ? Array.from(myPlayer.characters.values()) : [];
            opponentCharacters = opponentPlayer ? Array.from(opponentPlayer.characters.values()) : [];
            
            updateCharacterDisplay();
        });
    }

    function displayCardSelection() {
        cardSelection.innerHTML = '';
        allCards.forEach(card => {
            const cardElement = createCardElement(card);
            cardSelection.appendChild(cardElement);
        });
    }

    function createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.type}`;
        cardElement.innerHTML = `
            <h3>${card.name}</h3>
            <p>Type: ${card.type}</p>
            <p>Power: ${card.power}</p>
            <p>Defense: ${card.defense}</p>
            <p>Emo: ${card.emo}</p>
            <p>Rarity: ${card.rarity}</p>
        `;
        cardElement.addEventListener('click', () => selectCard(card.id, cardElement));
        return cardElement;
    }

    function selectCard(cardId, cardElement) {
        if (selectedCardIds.includes(cardId)) {
            selectedCardIds = selectedCardIds.filter(id => id !== cardId);
            cardElement.classList.remove('selected');
        } else if (selectedCardIds.length < 3) {
            selectedCardIds.push(cardId);
            cardElement.classList.add('selected');
        }
        startGameBtn.disabled = selectedCardIds.length !== 3;
    }
    startGameBtn.addEventListener('click', () => {
        if (selectedCardIds.length === 3) {
            room.send("selectCards", { cardIds: selectedCardIds });
            startGameBtn.disabled = true;
        }
    });
    document.getElementById('attack-btn').addEventListener('click', () => {
        if (isMyTurn && selectedCharacterIndex !== -1 && selectedOpponentCharacterIndex !== -1) {
            room.send("attack", { fromCharacterIndex: selectedCharacterIndex, toCharacterIndex: selectedOpponentCharacterIndex });
        }
    });

    document.getElementById('defend-btn').addEventListener('click', () => {
        if (isMyTurn && selectedCharacterIndex !== -1) {
            room.send("defend", { characterIndex: selectedCharacterIndex });
        }
    });

    function updateSelectionInfo() {
        const infoDiv = document.getElementById('selection-info');
        infoDiv.textContent = `Select ${3 - selectedCardIds.length} more card${3 - selectedCardIds.length !== 1 ? 's' : ''} to start the game`;
    }

    function updateStartButton() {
        const startButton = document.getElementById('start-game-btn');
        startButton.disabled = selectedCardIds.length !== 3;
    }

    function updateCharacterDisplay() {
        // Limit the display to 3 characters per player.
        updatePlayerCharacters(myCharacters.slice(0, 3), 'characters', true);
        updatePlayerCharacters(opponentCharacters.slice(0, 3), 'opponent-characters', false);
    }

    function updatePlayerCharacters(characters, elementId, isPlayer) {
        const charactersDiv = document.getElementById(elementId);
        charactersDiv.innerHTML = ''; // Clear previous entries
    
        characters.forEach((char, index) => {
            const charDiv = document.createElement('div');
            charDiv.className = `character type-${char.type} ${char.isDisabled ? 'disabled' : ''}`;
            
            // Add selected class based on index
            if (isPlayer && selectedCharacterIndex === index) charDiv.classList.add('selected');
            if (!isPlayer && selectedOpponentCharacterIndex === index) charDiv.classList.add('selected');
            
            // Character data display
            charDiv.innerHTML = `
                <h3>Character ${index + 1}</h3>
                <p>ID: ${char.id}</p>
                <p>Type: ${char.type}</p>
                <p>Power: ${char.power}</p>
                <p>Defense: ${char.defense}</p>
                <p class="emo-${char.emo}">Emo: ${char.emo}</p>
                <p class="rarity-${char.rarity}">Rarity: ${char.rarity}</p>
                <p>Mojo: ${char.mojo}/10</p>
                <p>Health: ${char.health}</p>
                <p>${char.isDisabled ? 'DISABLED' : 'ACTIVE'}</p>
            `;
            
            // Clickable actions based on the player or opponent
            if (isPlayer && isMyTurn && !char.isDisabled) {
                charDiv.onclick = () => selectCharacter(index, isPlayer);
            } else if (!isPlayer && isMyTurn) {
                charDiv.onclick = () => selectCharacter(index, isPlayer);
            }
    
            charactersDiv.appendChild(charDiv);
        });
    }

    function selectCharacter(index, isPlayer) {
        if (isPlayer) {
            selectedCharacterIndex = index;
            selectedOpponentCharacterIndex = -1; // Reset opponent selection when selecting own character
        } else {
            selectedOpponentCharacterIndex = index;
        }
        updateCharacterDisplay();
    }

    function log(message) {
        const logDiv = document.getElementById('log');
        logDiv.innerHTML += `<p>${message}</p>`;
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    document.getElementById('start-game-btn').addEventListener('click', () => {
        if (selectedCardIds.length === 3 && !room.state.selectionComplete) {
            room.send("selectCards", { cardIds: selectedCardIds });
            document.getElementById('start-game-btn').disabled = true;  // Disable the button to prevent multiple sends
            room.state.selectionComplete = true;  // Flag to indicate that the selection has been completed
        }
    });
    

    document.getElementById('attack-btn').addEventListener('click', () => {
        if (!isMyTurn || selectedCharacterIndex === -1 || selectedOpponentCharacterIndex === -1) return;
        room.send("attack", { fromCharacterIndex: selectedCharacterIndex, toCharacterIndex: selectedOpponentCharacterIndex });
        log(`Attacked opponent's character ${selectedOpponentCharacterIndex + 1} with my character ${selectedCharacterIndex + 1}`);
        selectedCharacterIndex = -1;
        selectedOpponentCharacterIndex = -1;
        updateCharacterDisplay();
    });

    document.getElementById('defend-btn').addEventListener('click', () => {
        if (!isMyTurn || selectedCharacterIndex === -1) return;
        room.send("defend", { characterIndex: selectedCharacterIndex });
        log(`Defended my character ${selectedCharacterIndex + 1}`);
        selectedCharacterIndex = -1;
        updateCharacterDisplay();
    });

    joinRoom();
});
