// WebSocket connection
let socket = null;
let isHost = false;
let roomCode = null;

// Online mode elements
const elements = {
    onlineScreen: document.getElementById('onlineScreen'),
    createRoomBtn: document.getElementById('createRoomBtn'),
    joinRoomBtn: document.getElementById('joinRoomBtn'),
    joinRoomInput: document.getElementById('joinRoomInput'),
    roomCode: document.getElementById('roomCode'),
    roomCodeText: document.getElementById('roomCodeText'),
    waitingMessage: document.getElementById('waitingMessage'),
    backToModesBtn: document.getElementById('backToModesBtn'),
    onlineBtn: document.getElementById('onlineBtn')
};

// Initialize WebSocket connection
function initializeWebSocket() {
    // Get the current page protocol and host
    const isSecure = window.location.protocol === 'https:';
    const wsProtocol = isSecure ? 'wss://' : 'ws://';
    
    // Use the Render.com deployed URL
    // Replace 'your-app-name' with your actual Render service name
    const wsUrl = wsProtocol + 'vibe-coding-tetris-battle.onrender.com';
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
        console.log('Connected to server');
    };
    
    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleMessage(message);
    };
    
    socket.onclose = () => {
        console.log('Disconnected from server');
        // Show reconnection message to user
        alert('Lost connection to server. Please refresh the page to reconnect.');
    };
    
    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Handle incoming messages
function handleMessage(message) {
    switch (message.type) {
        case 'room_created':
            roomCode = message.roomCode;
            elements.roomCodeText.textContent = roomCode;
            elements.roomCode.classList.remove('hidden');
            elements.waitingMessage.classList.remove('hidden');
            break;
            
        case 'player_joined':
            if (isHost) {
                elements.waitingMessage.classList.add('hidden');
                startOnlineGame(true);
            } else {
                startOnlineGame(false);
            }
            break;
            
        case 'game_state':
            updateOpponentState(message.state);
            break;
            
        case 'game_over':
            handleGameOver(message.winner);
            break;
    }
}

// Send game state to opponent
function sendGameState(state) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'game_state',
            roomCode: roomCode,
            state: state
        }));
    }
}

// Event Listeners
elements.onlineBtn.addEventListener('click', () => {
    elements.modeSelectionScreen.classList.remove('show-flex');
    elements.onlineScreen.classList.add('show-flex');
    initializeWebSocket();
});

elements.createRoomBtn.addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'create_room'
        }));
        isHost = true;
    }
});

elements.joinRoomBtn.addEventListener('click', () => {
    const code = elements.joinRoomInput.value.trim();
    if (code && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'join_room',
            roomCode: code
        }));
        roomCode = code;
        isHost = false;
    }
});

elements.backToModesBtn.addEventListener('click', () => {
    elements.onlineScreen.classList.remove('show-flex');
    elements.modeSelectionScreen.classList.add('show-flex');
    if (socket) {
        socket.close();
    }
}); 