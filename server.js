const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 8080;

// Serve static files
app.use(express.static(path.join(__dirname, '.')));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active rooms and their players
const rooms = new Map();

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'create_room':
                    handleCreateRoom(ws);
                    break;
                    
                case 'join_room':
                    handleJoinRoom(ws, data.roomCode);
                    break;
                    
                case 'game_state':
                    handleGameState(ws, data);
                    break;
                    
                case 'game_over':
                    handleGameOver(ws, data);
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    ws.on('close', () => {
        handleDisconnect(ws);
    });
});

function handleCreateRoom(ws) {
    // Generate a unique 6-character room code
    const roomCode = uuidv4().slice(0, 6).toUpperCase();
    
    // Create new room
    rooms.set(roomCode, {
        host: ws,
        guest: null,
        hostReady: false,
        guestReady: false
    });
    
    // Store room code in websocket instance
    ws.roomCode = roomCode;
    
    // Send room code to host
    ws.send(JSON.stringify({
        type: 'room_created',
        roomCode: roomCode
    }));
}

function handleJoinRoom(ws, roomCode) {
    const room = rooms.get(roomCode);
    
    if (!room) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room not found'
        }));
        return;
    }
    
    if (room.guest) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room is full'
        }));
        return;
    }
    
    // Add guest to room
    room.guest = ws;
    ws.roomCode = roomCode;
    
    // Notify both players
    room.host.send(JSON.stringify({
        type: 'player_joined'
    }));
    
    ws.send(JSON.stringify({
        type: 'player_joined'
    }));
}

function handleGameState(ws, data) {
    const room = rooms.get(data.roomCode);
    if (!room) return;
    
    // Forward game state to opponent
    const opponent = room.host === ws ? room.guest : room.host;
    if (opponent) {
        opponent.send(JSON.stringify({
            type: 'game_state',
            state: data.state
        }));
    }
}

function handleGameOver(ws, data) {
    const room = rooms.get(data.roomCode);
    if (!room) return;
    
    // Forward game over to opponent
    const opponent = room.host === ws ? room.guest : room.host;
    if (opponent) {
        opponent.send(JSON.stringify({
            type: 'game_over',
            winner: data.winner
        }));
    }
    
    // Clean up room after game over
    rooms.delete(data.roomCode);
}

function handleDisconnect(ws) {
    if (!ws.roomCode) return;
    
    const room = rooms.get(ws.roomCode);
    if (!room) return;
    
    // Notify opponent of disconnection
    const opponent = room.host === ws ? room.guest : room.host;
    if (opponent) {
        opponent.send(JSON.stringify({
            type: 'opponent_disconnected'
        }));
    }
    
    // Clean up room
    rooms.delete(ws.roomCode);
}

// Start the server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 