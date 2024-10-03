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

    startMatchmakingBtn.addEventListener('click', startMatchmaking);

    async function startMatchmaking() {
        startMatchmakingBtn.disabled = true;
        matchmakingStatus.textContent = "Searching for a match...";

        try {
            // Use the matchmaker to find a game
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
        room.onMessage("start", (message) => {
            document.getElementById('card-selection').style.display = 'none';
            document.getElementById('start-game-btn').style.display = 'none';
            document.getElementById('selection-info').style.display = 'none';
            log(`Game is starting! Countdown: ${message.countdown}, World Type: ${message.worldType}`);
            document.getElementById('world-info').innerText = `World Type: ${message.worldType}`;
        });

        room.onMessage("countdown", (message) => {
            log(`Countdown: ${message.countdown}`);
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
        const selectionDiv = document.getElementById('card-selection');
        selectionDiv.innerHTML = '';
        allCards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = `card type-${card.type}`;
            cardDiv.innerHTML = `
                <h3>${card.name}</h3>
                <p>Type: ${card.type}</p>
                <p>Power: ${card.power}</p>
                <p>Defense: ${card.defense}</p>
                <p class="emo-${card.emo}">Emo: ${card.emo}</p>
                <p class="rarity-${card.rarity}">Rarity: ${card.rarity}</p>
                <p>Mojo: ${card.mojo}/10</p>
            `;
            cardDiv.onclick = () => selectCard(card.id, cardDiv);
            selectionDiv.appendChild(cardDiv);
        });
        document.getElementById('start-game-btn').style.display = 'block';
        updateSelectionInfo();
    }

    function selectCard(cardId, cardDiv) {
        if (selectedCardIds.includes(cardId)) {
            selectedCardIds = selectedCardIds.filter(id => id !== cardId);
            cardDiv.classList.remove('selected');
        } else if (selectedCardIds.length < 3) {
            selectedCardIds.push(cardId);
            cardDiv.classList.add('selected');
        }
        updateSelectionInfo();
        updateStartButton();
    }

    function updateSelectionInfo() {
        const infoDiv = document.getElementById('selection-info');
        infoDiv.textContent = `Select ${3 - selectedCardIds.length} more card${3 - selectedCardIds.length !== 1 ? 's' : ''} to start the game`;
    }

    function updateStartButton() {
        const startButton = document.getElementById('start-game-btn');
        startButton.disabled = selectedCardIds.length !== 3;
    }

    function updateCharacterDisplay() {
        updatePlayerCharacters(myCharacters, 'characters', true);
        updatePlayerCharacters(opponentCharacters, 'opponent-characters', false);
    }

    function updatePlayerCharacters(characters, elementId, isPlayer) {
        const charactersDiv = document.getElementById(elementId);
        charactersDiv.innerHTML = '';
        characters.forEach((char, index) => {
            const charDiv = document.createElement('div');
            charDiv.className = `character type-${char.type} ${char.isDisabled ? 'disabled' : ''}`;
            if (isPlayer && selectedCharacterIndex === index) charDiv.classList.add('selected');
            if (!isPlayer && selectedOpponentCharacterIndex === index) charDiv.classList.add('selected');
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
        if (selectedCardIds.length === 3) {
            room.send("selectCards", { cardIds: selectedCardIds });
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
