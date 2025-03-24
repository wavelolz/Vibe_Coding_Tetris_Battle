// Game elements
const elements = {
    canvas1: document.getElementById('tetris1'),
    canvas2: document.getElementById('tetris2'),
    context1: document.getElementById('tetris1').getContext('2d'),
    context2: document.getElementById('tetris2').getContext('2d'),
    scoreElement1: document.getElementById('score1'),
    scoreElement2: document.getElementById('score2'),
    failsElement1: document.getElementById('fails1'),
    failsElement2: document.getElementById('fails2'),
    warningElement1: document.getElementById('warning1'),
    warningElement2: document.getElementById('warning2'),
    countdownElement: document.getElementById('countdown'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    winnerText: document.getElementById('winnerText'),
    finalScores: document.getElementById('finalScores'),
    modeSelectionScreen: document.getElementById('modeSelectionScreen'),
    gameContainer: document.getElementById('gameContainer'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    backHomeBtn: document.getElementById('backHomeBtn'),
    startCountdown: document.getElementById('startCountdown'),
    countdownNumber: document.querySelector('.countdown-number')
};

// Create and load bomb image
const bombImage = new Image();
bombImage.src = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="55" r="35" fill="white"/>
    <circle cx="50" cy="55" r="32" fill="black"/>
    <path d="M50 20 L50 5 M65 25 L80 10 M35 25 L20 10" stroke="black" stroke-width="8"/>
    <circle cx="65" cy="35" r="8" fill="white"/>
    <path d="M45 15 Q50 10 55 15" stroke="black" stroke-width="4" fill="none"/>
    <path d="M75 25 L90 20 L85 35" fill="yellow"/>
</svg>
`);

// Game constants
const scale = 20;
const rows = 20;
const columns = 12;
const baseDropInterval = 1000;
const speedIncreaseInterval = 20000;
const GAME_DURATION = 120000;

// Game state
let isSinglePlayer = false;
let lastTime = 0;
let gameStartTime = 0;
let gameLoop = null;  // Store the animation frame ID

// Initialize screen visibility
window.addEventListener('DOMContentLoaded', () => {
    // Show mode selection screen initially
    elements.modeSelectionScreen.classList.add('show-flex');
});

// Add event listener for Play Again button
elements.playAgainBtn.addEventListener('click', () => {
    // Hide game over screen
    elements.gameOverScreen.classList.remove('show-flex');
    
    // Show mode selection screen
    elements.modeSelectionScreen.classList.add('show-flex');
    
    // Hide game container
    elements.gameContainer.classList.remove('show-flex');
    elements.gameContainer.classList.add('hidden');
    
    // Reset game states
    players.forEach(player => {
        player.score = 0;
        player.fails = 0;
        player.board = createBoard(rows, columns);
        player.matrix = null;
        player.pos = {x: 0, y: 0};
        player.dropCounter = 0;
        player.dropInterval = baseDropInterval;
        player.pieceSequence = [];
        player.scoreElement.textContent = '0';
        player.failsElement.textContent = '0';
        player.warningElement.classList.add('hidden');
        player.isHalted = false;
        player.haltEndTime = 0;
    });
});

// Add event listener for Back Home button
elements.backHomeBtn.addEventListener('click', () => {
    // Cancel the current game loop
    if (gameLoop !== null) {
        cancelAnimationFrame(gameLoop);
        gameLoop = null;
    }
    
    // Hide game container and game over screen
    elements.gameContainer.classList.remove('show-flex');
    elements.gameContainer.classList.add('hidden');
    elements.gameOverScreen.classList.remove('show-flex');
    
    // Show mode selection screen
    elements.modeSelectionScreen.classList.add('show-flex');
    
    // Reset game states
    players.forEach(player => {
        player.score = 0;
        player.fails = 0;
        player.board = createBoard(rows, columns);
        player.matrix = null;
        player.pos = {x: 0, y: 0};
        player.dropCounter = 0;
        player.dropInterval = baseDropInterval;
        player.pieceSequence = [];
        player.scoreElement.textContent = '0';
        player.failsElement.textContent = '0';
        player.warningElement.classList.add('hidden');
        player.isHalted = false;
        player.haltEndTime = 0;
    });
});

// Initialize game mode selection
document.getElementById('singlePlayerBtn').addEventListener('click', () => {
    isSinglePlayer = true;
    startGame();
});

document.getElementById('twoPlayerBtn').addEventListener('click', () => {
    isSinglePlayer = false;
    startGame();
});

// Game state for both players
const players = [
    {
        context: elements.context1,
        board: createBoard(rows, columns),
        pos: {x: 0, y: 0},
        matrix: null,
        score: 0,
        fails: 0,
        dropCounter: 0,
        dropInterval: baseDropInterval,
        scoreElement: elements.scoreElement1,
        failsElement: elements.failsElement1,
        warningElement: elements.warningElement1,
        lastTime: 0,
        pieceSequence: [],
        isHalted: false,
        haltEndTime: 0
    },
    {
        context: elements.context2,
        board: createBoard(rows, columns),
        pos: {x: 0, y: 0},
        matrix: null,
        score: 0,
        fails: 0,
        dropCounter: 0,
        dropInterval: baseDropInterval,
        scoreElement: elements.scoreElement2,
        failsElement: elements.failsElement2,
        warningElement: elements.warningElement2,
        lastTime: 0,
        pieceSequence: [],
        isHalted: false,
        haltEndTime: 0
    }
];

// Colors for tetrominos
const colors = [
    null,
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF', // Z
    '#808080', // Blocking piece (gray)
    '#FF0000'  // Bomb piece (red)
];

// Tetromino shapes
const pieces = {
    'I': [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
    ],
    'J': [
        [0, 2, 0],
        [0, 2, 0],
        [2, 2, 0],
    ],
    'L': [
        [0, 3, 0],
        [0, 3, 0],
        [0, 3, 3],
    ],
    'O': [
        [4, 4],
        [4, 4],
    ],
    'S': [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0],
    ],
    'T': [
        [0, 0, 0],
        [6, 6, 6],
        [0, 6, 0],
    ],
    'Z': [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
    ]
};

function createBoard(rows, cols) {
    const board = [];
    for (let y = 0; y < rows; y++) {
        board.push(new Array(cols).fill(0));
    }
    return board;
}

function collide(board, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x] !== 0 &&
                (board[y + o.y] &&
                board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createPiece(type) {
    // Create a deep copy of the piece matrix
    return pieces[type].map(row => [...row]);
}

function draw(playerState) {
    // Clear the canvas
    playerState.context.fillStyle = '#000';
    playerState.context.fillRect(0, 0, elements.canvas1.width, elements.canvas1.height);

    // Calculate the actual canvas dimensions in grid units
    const canvasWidth = elements.canvas1.width / scale;
    const canvasHeight = elements.canvas1.height / scale;

    // Draw background grid (slightly brighter)
    playerState.context.strokeStyle = '#222222';
    playerState.context.lineWidth = 0.05;

    // Draw vertical background lines
    for (let x = 0; x <= canvasWidth; x++) {
        playerState.context.beginPath();
        playerState.context.moveTo(x, 0);
        playerState.context.lineTo(x, canvasHeight);
        playerState.context.stroke();
    }

    // Draw horizontal background lines
    for (let y = 0; y <= canvasHeight; y++) {
        playerState.context.beginPath();
        playerState.context.moveTo(0, y);
        playerState.context.lineTo(canvasWidth, y);
        playerState.context.stroke();
    }

    // Draw game area grid lines (even brighter)
    playerState.context.strokeStyle = '#333333';
    playerState.context.lineWidth = 0.05;

    // Draw vertical lines for game area
    for (let x = 0; x <= columns; x++) {
        playerState.context.beginPath();
        playerState.context.moveTo(x, 0);
        playerState.context.lineTo(x, rows);
        playerState.context.stroke();
    }

    // Draw horizontal lines for game area
    for (let y = 0; y <= rows; y++) {
        playerState.context.beginPath();
        playerState.context.moveTo(0, y);
        playerState.context.lineTo(columns, y);
        playerState.context.stroke();
    }

    // Draw the game pieces
    drawMatrix(playerState.context, playerState.board, {x: 0, y: 0});
    drawMatrix(playerState.context, playerState.matrix, playerState.pos);
}

function drawMatrix(context, matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                if (value === 9) {
                    // Draw white background square first
                    context.fillStyle = '#FFFFFF';
                    context.fillRect(
                        x + offset.x,
                        y + offset.y,
                        1,
                        1
                    );
                    // Draw bomb image
                    context.drawImage(
                        bombImage,
                        x + offset.x,
                        y + offset.y,
                        1,
                        1
                    );
                } else {
                    // Draw regular blocks
                    context.fillStyle = colors[value];
                    context.fillRect(
                        x + offset.x,
                        y + offset.y,
                        1,
                        1
                    );
                    
                    // Draw block border
                    context.strokeStyle = '#fff';
                    context.lineWidth = 0.05;
                    context.strokeRect(
                        x + offset.x,
                        y + offset.y,
                        1,
                        1
                    );
                }
            }
        });
    });
}

function merge(board, playerState) {
    let bombHit = false;
    let bombRow = -1;
    
    playerState.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const boardY = y + playerState.pos.y;
                const boardX = x + playerState.pos.x;
                
                // Check if we're landing directly on a bomb
                if (boardY + 1 < rows && board[boardY + 1][boardX] === 9) {
                    bombHit = true;
                    bombRow = boardY + 1;
                }
                
                board[boardY][boardX] = value;
            }
        });
    });
    
    // If a bomb was hit, remove that line of blocks
    if (bombHit && bombRow !== -1) {
        // Remove the line with blocks and bomb
        board.splice(bombRow, 1);
        // Add a new empty line at the top
        board.unshift(new Array(columns).fill(0));
    }
}

function rotate(matrix) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    matrix.reverse();
}

function playerDrop(playerState) {
    playerState.pos.y++;
    if (collide(playerState.board, playerState)) {
        playerState.pos.y--;
        merge(playerState.board, playerState);
        playerReset(playerState);
        clearLines(playerState);
        updateScore(playerState);
    }
    playerState.dropCounter = 0;
}

function playerMove(playerState, dir) {
    playerState.pos.x += dir;
    if (collide(playerState.board, playerState)) {
        playerState.pos.x -= dir;
    }
}

function playerRotate(playerState) {
    const pos = playerState.pos.x;
    let offset = 1;
    rotate(playerState.matrix);
    while (collide(playerState.board, playerState)) {
        playerState.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > playerState.matrix[0].length) {
            rotate(playerState.matrix);
            rotate(playerState.matrix);
            rotate(playerState.matrix);
            playerState.pos.x = pos;
            return;
        }
    }
}

function generateNextPiece(playerState) {
    if (playerState.pieceSequence.length === 0) {
        // Generate a new shuffled sequence of pieces
        const pieces = 'IJLOSTZ';
        playerState.pieceSequence = pieces.split('')
            .sort(() => Math.random() - 0.5);
    }
    return playerState.pieceSequence.pop();
}

function showWarningAndHalt(playerState) {
    // Show warning
    playerState.warningElement.classList.remove('hidden');
    
    // Set halt state
    playerState.isHalted = true;
    playerState.haltEndTime = Date.now() + 1500; // 1.5 seconds
    
    // Hide warning after 1.5 seconds
    setTimeout(() => {
        playerState.warningElement.classList.add('hidden');
        playerState.isHalted = false;
    }, 1500);
}

function playerReset(playerState) {
    const nextPiece = generateNextPiece(playerState);
    playerState.matrix = createPiece(nextPiece);
    playerState.pos.y = 0;
    playerState.pos.x = (playerState.board[0].length / 2 | 0) -
                       (playerState.matrix[0].length / 2 | 0);
    if (collide(playerState.board, playerState)) {
        // Player has failed - increment fail counter and show warning
        playerState.fails++;
        playerState.failsElement.textContent = playerState.fails;
        showWarningAndHalt(playerState);
        
        // Reset the board and score
        playerState.board.forEach(row => row.fill(0));
        playerState.score = 0;
        updateScore(playerState);
    }
}

function injectBlockingLine(targetPlayer) {
    // Remove the top row if it's full
    targetPlayer.board.shift();
    
    // Create a new blocking line with a bomb
    const blockingLine = new Array(columns).fill(8);
    // Place a bomb at a random position
    const bombPosition = Math.floor(Math.random() * columns);
    blockingLine[bombPosition] = 9;
    
    // Add the blocking line at the bottom
    targetPlayer.board.push(blockingLine);
    
    // If the current piece collides after adding blocking line, move it up
    while (collide(targetPlayer.board, targetPlayer)) {
        targetPlayer.pos.y--;
        // If we can't move up anymore, trigger a fail
        if (targetPlayer.pos.y < 0) {
            playerReset(targetPlayer);
            break;
        }
    }
}

function clearLines(playerState) {
    let linesCleared = 0;
    outer: for (let y = playerState.board.length - 1; y > 0; --y) {
        for (let x = 0; x < playerState.board[y].length; ++x) {
            // Skip lines that contain blocking pieces or bombs (value 8 or 9)
            if (playerState.board[y][x] === 0 || playerState.board[y][x] === 8 || playerState.board[y][x] === 9) {
                continue outer;
            }
        }
        const row = playerState.board.splice(y, 1)[0].fill(0);
        playerState.board.unshift(row);
        ++y;
        linesCleared++;
    }
    
    // Award 10 points per line cleared
    const previousScore = playerState.score;
    playerState.score += linesCleared * 10;
    
    // In two-player mode, check if we should inject blocking line
    if (!isSinglePlayer && linesCleared > 0) {
        const scoreIncrease = playerState.score - previousScore;
        const blockingLines = Math.floor(scoreIncrease / 10);
        
        // Determine which player to target
        const targetPlayer = playerState === players[0] ? players[1] : players[0];
        
        // Inject blocking lines
        for (let i = 0; i < blockingLines; i++) {
            injectBlockingLine(targetPlayer);
        }
    }
}

function updateScore(playerState) {
    playerState.scoreElement.textContent = playerState.score;
}

function playerInstantDrop(playerState) {
    while (!collide(playerState.board, playerState)) {
        playerState.pos.y++;
    }
    playerState.pos.y--;
    merge(playerState.board, playerState);
    playerReset(playerState);
    clearLines(playerState);
    updateScore(playerState);
    playerState.dropCounter = 0;
}

// Scale both canvases
elements.context1.scale(scale, scale);
elements.context2.scale(scale, scale);

function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000) / 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function endGame() {
    // Cancel the current game loop
    if (gameLoop !== null) {
        cancelAnimationFrame(gameLoop);
        gameLoop = null;
    }

    // Determine winner
    let winner;
    if (isSinglePlayer) {
        winner = players[0].score > 0 ? 'Player 1' : 'No Winner';
    } else {
        if (players[0].score > players[1].score) {
            winner = 'Player 1';
        } else if (players[1].score > players[0].score) {
            winner = 'Player 2';
        } else {
            winner = 'Tie';
        }
    }

    // Display results
    elements.winnerText.textContent = winner === 'Tie' ? "It's a Tie!" : `${winner} Wins!`;
    elements.finalScores.textContent = `Final Scores:\nPlayer 1: ${players[0].score} (Fails: ${players[0].fails})\n${!isSinglePlayer ? `Player 2: ${players[1].score} (Fails: ${players[1].fails})` : ''}`;
    elements.gameOverScreen.classList.add('show-flex');
}

function spawnPiece(playerState) {
    const nextPiece = generateNextPiece(playerState);
    playerState.matrix = createPiece(nextPiece);
    playerState.pos.y = 0;
    playerState.pos.x = (playerState.board[0].length / 2 | 0) -
                       (playerState.matrix[0].length / 2 | 0);
    if (collide(playerState.board, playerState)) {
        playerState.board.forEach(row => row.fill(0));
        playerState.score = 0;
        updateScore(playerState);
    }
}

function movePiece(playerState, dx, dy) {
    playerState.pos.x += dx;
    playerState.pos.y += dy;
    if (collide(playerState.board, playerState)) {
        playerState.pos.x -= dx;
        playerState.pos.y -= dy;
        if (dy > 0) {
            merge(playerState.board, playerState);
            playerReset(playerState);
            clearLines(playerState);
            updateScore(playerState);
        }
    }
}

function startGame() {
    // Hide mode selection screen and show game container
    elements.modeSelectionScreen.classList.remove('show-flex');
    elements.gameContainer.classList.remove('hidden');
    elements.gameContainer.classList.add('show-flex');
    elements.gameOverScreen.classList.remove('show-flex');
    
    // Add single-player class if in single player mode
    if (isSinglePlayer) {
        elements.gameContainer.classList.add('single-player');
    } else {
        elements.gameContainer.classList.remove('single-player');
    }
    
    // Reset game state
    players.forEach(player => {
        player.score = 0;
        player.fails = 0;
        player.lines = 0;
        player.level = 1;
        player.board = createBoard(rows, columns);
        player.matrix = null;
        player.pos = {x: 0, y: 0};
        player.dropCounter = 0;
        player.dropInterval = baseDropInterval;
        player.pieceSequence = [];
        player.scoreElement.textContent = '0';
        player.failsElement.textContent = '0';
        player.warningElement.classList.add('hidden');
        player.isHalted = false;
        player.haltEndTime = 0;
    });

    // Show countdown overlay
    elements.startCountdown.classList.remove('hidden');
    elements.startCountdown.classList.add('show-flex');
    elements.countdownNumber.textContent = '3';

    // Start countdown
    let count = 3;
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            elements.countdownNumber.textContent = count;
        } else {
            // Clear interval and hide countdown
            clearInterval(countdownInterval);
            elements.startCountdown.classList.remove('show-flex');
            elements.startCountdown.classList.add('hidden');
            
            // Start the actual game
            gameStartTime = Date.now();
            players.forEach(player => {
                spawnPiece(player);
            });
            lastTime = 0;
            gameLoop = requestAnimationFrame(update);
        }
    }, 1000);
}

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    // Update countdown timer
    const currentTime = Date.now();
    const elapsedTime = currentTime - gameStartTime;
    const remainingTime = Math.max(0, GAME_DURATION - elapsedTime);
    elements.countdownElement.textContent = formatTime(remainingTime);

    // Calculate speed factor based on elapsed time
    const timeLevel = Math.floor(elapsedTime / speedIncreaseInterval);
    const speedFactor = Math.pow(1.4, timeLevel);

    // Check if game should end
    if (remainingTime <= 0) {
        endGame();
        return;
    }

    // Update both players
    players.forEach(player => {
        // Only update if player is not halted and not game over
        if (!player.isHalted && !player.gameOver) {
            // Update drop interval based on current speed factor
            player.dropInterval = baseDropInterval / speedFactor;
            
            player.dropCounter += deltaTime;
            if (player.dropCounter > player.dropInterval) {
                movePiece(player, 0, 1);
                player.dropCounter = 0;
            }
        }
        // Always draw the board, even when halted
        draw(player);
    });

    // In single player mode, only update player 1
    if (isSinglePlayer) {
        draw(players[1]);
    }

    // Store the animation frame ID
    gameLoop = requestAnimationFrame(update);
}

// Event listeners for controls
document.addEventListener('keydown', event => {
    // Prevent default behavior for game controls
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
    }
    
    if (isSinglePlayer) {
        // Single player controls (Arrow keys + Space)
        if (!players[0].isHalted) {
            if (event.key === 'ArrowLeft') {
                playerMove(players[0], -1);
            } else if (event.key === 'ArrowRight') {
                playerMove(players[0], 1);
            } else if (event.key === 'ArrowDown') {
                playerDrop(players[0]);
            } else if (event.key === 'ArrowUp') {
                playerRotate(players[0]);
            } else if (event.key === ' ') {
                playerInstantDrop(players[0]);
            }
        }
    } else {
        // Player 1 controls (WASD + C)
        if (!players[0].isHalted) {
            if (event.key.toLowerCase() === 'a') {
                playerMove(players[0], -1);
            } else if (event.key.toLowerCase() === 'd') {
                playerMove(players[0], 1);
            } else if (event.key.toLowerCase() === 's') {
                playerDrop(players[0]);
            } else if (event.key.toLowerCase() === 'w') {
                playerRotate(players[0]);
            } else if (event.key.toLowerCase() === 'c') {
                playerInstantDrop(players[0]);
            }
        }
        
        // Player 2 controls (Arrows + Enter)
        if (!players[1].isHalted) {
            if (event.key === 'ArrowLeft') {
                playerMove(players[1], -1);
            } else if (event.key === 'ArrowRight') {
                playerMove(players[1], 1);
            } else if (event.key === 'ArrowDown') {
                playerDrop(players[1]);
            } else if (event.key === 'ArrowUp') {
                playerRotate(players[1]);
            } else if (event.key === 'Enter') {
                playerInstantDrop(players[1]);
            }
        }
    }
}); 