class CaroGame {    constructor() {
        this.BOARD_SIZE = 15; // TÄƒng kĂ­ch thÆ°á»›c bĂ n cá» lĂªn 15x15
        this.EMPTY = '';
        this.HUMAN = 'O';
        this.AI = 'X';
        this.WINNING_LENGTH = 5; // Sá»‘ quĂ¢n liĂªn tiáº¿p Ä‘á»ƒ tháº¯ng lĂ  5
        
        // Há»‡ sá»‘ Ä‘iá»ƒm cho cĂ¡c máº«u táº¥n cĂ´ng
        this.ATTACK_SCORES = {            WIN: 100000,        // Tháº¯ng (5 quĂ¢n liĂªn tiáº¿p)
            FOUR_OPEN: 15000,  // 4 quĂ¢n 2 Ä‘áº§u má»Ÿ
            FOUR_CLOSED: 5000, // 4 quĂ¢n 1 Ä‘áº§u má»Ÿ
            THREE_OPEN: 3000,  // 3 quĂ¢n 2 Ä‘áº§u má»Ÿ
            TWO_CLOSED: 100,   // 2 quĂ¢n 1 Ä‘áº§u má»Ÿ
            ONE: 10,           // 1 quĂ¢n
            DIAGONAL_BONUS: 1.5 // Há»‡ sá»‘ cá»™ng thĂªm cho Ä‘Æ°á»ng chĂ©o
        };

        // Há»‡ sá»‘ Ä‘iá»ƒm cho phĂ²ng thá»§
        this.DEFENSE_SCORES = {            BLOCK_WIN: 90000,         // Cháº·n 5 quĂ¢n
            BLOCK_FOUR_OPEN: 14000,   // Cháº·n 4 quĂ¢n 2 Ä‘áº§u má»Ÿ
            BLOCK_FOUR_CLOSED: 4500,  // Cháº·n 4 quĂ¢n 1 Ä‘áº§u má»Ÿ
            BLOCK_TWO_OPEN: 450,   // Cháº·n 2 quĂ¢n 2 Ä‘áº§u má»Ÿ
            DIAGONAL_BONUS: 1.3    // Há»‡ sá»‘ cá»™ng thĂªm cho Ä‘Æ°á»ng chĂ©o
        };

        // Khá»Ÿi táº¡o bĂ n cá»
        this.board = Array(this.BOARD_SIZE).fill().map(() => Array(this.BOARD_SIZE).fill(this.EMPTY));
        this.gameOver = false;
        this.isProcessing = false;
        this.playerScore = 0;
        this.computerScore = 0;
        this.winningCells = [];
        
        this.initializeBoard();
        this.addEventListeners();
    }    initializeBoard() {
        const boardElement = document.getElementById('board');
        if (!boardElement) return;
        
        boardElement.innerHTML = '';
        
        for (let i = 0; i < this.BOARD_SIZE; i++) {
            for (let j = 0; j < this.BOARD_SIZE; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleCellClick(i, j);
                });
                boardElement.appendChild(cell);
            }
        }
    }

    addEventListeners() {
        document.getElementById('restart').addEventListener('click', () => {
            this.restart();
        });
    }    handleCellClick(row, col) {
        if (this.gameOver || this.board[row][col] !== this.EMPTY || this.isProcessing) {
            return;
        }
        this.makeMove(row, col);
    }

    getBestMove() {
        const candidateMoves = this.getCandidateMoves();
        let bestMove = null;
        let bestScore = -Infinity;
        let bestTotalScore = -Infinity; // DĂ¹ng cho xá»­ lĂ½ trÆ°á»ng há»£p Ä‘á»“ng háº¡ng

        for (const move of candidateMoves) {
            // Thá»­ nÆ°á»›c Ä‘i
            this.board[move.row][move.col] = this.AI;
            
            // TĂ­nh Ä‘iá»ƒm táº¥n cĂ´ng vĂ  phĂ²ng thá»§
            const attackScore = this.evaluateAttack(move.row, move.col);
            const defenseScore = this.evaluateDefense(move.row, move.col);
            
            // Láº¥y Ä‘iá»ƒm cao nháº¥t giá»¯a táº¥n cĂ´ng vĂ  phĂ²ng thá»§
            const score = Math.max(attackScore, defenseScore);
            const totalScore = attackScore + defenseScore; // DĂ¹ng cho xá»­ lĂ½ Ä‘á»“ng háº¡ng
            
            // Cáº­p nháº­t nÆ°á»›c Ä‘i tá»‘t nháº¥t
            if (score > bestScore || (score === bestScore && totalScore > bestTotalScore)) {
                bestScore = score;
                bestTotalScore = totalScore;
                bestMove = move;
            }
            
            // HoĂ n tĂ¡c nÆ°á»›c Ä‘i thá»­
            this.board[move.row][move.col] = this.EMPTY;
        }

        return bestMove;
    }

    getCandidateMoves() {
        const moves = [];
        
        // NÆ°á»›c Ä‘i Ä‘áº§u tiĂªn - Ä‘Ă¡nh vĂ o trung tĂ¢m hoáº·c xung quanh
        if (this.isBoardEmpty()) {
            const center = Math.floor(this.BOARD_SIZE / 2);
            return [{ row: center, col: center }];
        }

        // TĂ¬m cĂ¡c Ă´ trá»‘ng cĂ³ quĂ¢n xung quanh
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === this.EMPTY && this.hasAdjacentPiece(row, col)) {
                    moves.push({ row, col });
                }
            }
        }
        
        return moves;
    }

    evaluateAttack(row, col) {
        let score = 0;
        const directions = [
            [[0, 1], [0, -1]],  // Ngang
            [[1, 0], [-1, 0]],  // Dá»c
            [[1, 1], [-1, -1]], // ChĂ©o xuá»‘ng
            [[1, -1], [-1, 1]]  // ChĂ©o lĂªn
        ];

        for (const [dir1, dir2] of directions) {
            const isDiagonal = Math.abs(dir1[0]) === 1 && Math.abs(dir1[1]) === 1;
            const pattern = this.getPattern(row, col, dir1, dir2, this.AI);
            
            // TĂ­nh Ä‘iá»ƒm dá»±a trĂªn máº«u
            let patternScore = this.getPatternScore(pattern, true);
            
            // Cá»™ng thĂªm Ä‘iá»ƒm cho Ä‘Æ°á»ng chĂ©o
            if (isDiagonal) {
                patternScore *= this.ATTACK_SCORES.DIAGONAL_BONUS;
            }
            
            score += patternScore;
        }

        return score;
    }

    evaluateDefense(row, col) {
        let score = 0;
        const directions = [
            [[0, 1], [0, -1]],  // Ngang
            [[1, 0], [-1, 0]],  // Dá»c
            [[1, 1], [-1, -1]], // ChĂ©o xuá»‘ng
            [[1, -1], [-1, 1]]  // ChĂ©o lĂªn
        ];

        for (const [dir1, dir2] of directions) {
            const isDiagonal = Math.abs(dir1[0]) === 1 && Math.abs(dir1[1]) === 1;
            const pattern = this.getPattern(row, col, dir1, dir2, this.HUMAN);
            
            // TĂ­nh Ä‘iá»ƒm dá»±a trĂªn máº«u
            let patternScore = this.getPatternScore(pattern, false);
            
            // Cá»™ng thĂªm Ä‘iá»ƒm cho Ä‘Æ°á»ng chĂ©o
            if (isDiagonal) {
                patternScore *= this.DEFENSE_SCORES.DIAGONAL_BONUS;
            }
            
            score += patternScore;
        }

        return score;
    }

    getPattern(row, col, dir1, dir2, player) {
        let count = 1;
        let openEnds = 0;

        // Kiá»ƒm tra hÆ°á»›ng thá»© nháº¥t
        let r = row + dir1[0];
        let c = col + dir1[1];
        let blocked1 = false;
        
        while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE) {
            if (this.board[r][c] === player) {
                count++;
            } else if (this.board[r][c] === this.EMPTY) {
                openEnds++;
                break;
            } else {
                blocked1 = true;
                break;
            }
            r += dir1[0];
            c += dir1[1];
        }

        // Kiá»ƒm tra hÆ°á»›ng thá»© hai
        r = row + dir2[0];
        c = col + dir2[1];
        let blocked2 = false;
        
        while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE) {
            if (this.board[r][c] === player) {
                count++;
            } else if (this.board[r][c] === this.EMPTY) {
                openEnds++;
                break;
            } else {
                blocked2 = true;
                break;
            }
            r += dir2[0];
            c += dir2[1];
        }

        return { count, openEnds, isBlocked: blocked1 && blocked2 };
    }    getPatternScore(pattern, isAttack) {
        if (pattern.count >= this.WINNING_LENGTH) {
            return isAttack ? this.ATTACK_SCORES.WIN : this.DEFENSE_SCORES.BLOCK_WIN;
        }

        if (isAttack) {
            switch(pattern.count) {
                case 4:
                    return pattern.openEnds === 2 ? this.ATTACK_SCORES.FOUR_OPEN :
                           pattern.openEnds === 1 ? this.ATTACK_SCORES.FOUR_CLOSED : 0;
                case 3:
                    return pattern.openEnds === 2 ? this.ATTACK_SCORES.THREE_OPEN : 
                           pattern.openEnds === 1 ? this.ATTACK_SCORES.THREE_CLOSED : 0;
                case 1:
                    return pattern.openEnds > 0 ? this.ATTACK_SCORES.ONE : 0;
                default:
                    return 0;
            }        } else {
            switch(pattern.count) {
                case 4:
                    return pattern.openEnds === 2 ? this.DEFENSE_SCORES.BLOCK_FOUR_OPEN :
                           pattern.openEnds === 1 ? this.DEFENSE_SCORES.BLOCK_FOUR_CLOSED : 0;
                case 3:
                    return pattern.openEnds === 2 ? this.DEFENSE_SCORES.BLOCK_THREE_OPEN :
                           pattern.openEnds === 1 ? this.DEFENSE_SCORES.BLOCK_THREE_CLOSED : 0;
                default:
                    return 0;
            }
        }
    }

    hasAdjacentPiece(row, col) {
        const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
        
        for (const [dx, dy] of directions) {
            const newRow = row + dx;
            const newCol = col + dy;
            
            if (newRow >= 0 && newRow < this.BOARD_SIZE && 
                newCol >= 0 && newCol < this.BOARD_SIZE &&
                this.board[newRow][newCol] !== this.EMPTY) {
                return true;
            }
        }
        
        return false;
    }

    isBoardEmpty() {
        return this.board.every(row => row.every(cell => cell === this.EMPTY));
    }    makeMove(row, col) {
        // Human's move
        this.board[row][col] = this.HUMAN;
        this.lastMove = { row, col };
        this.updateCell(row, col);

        if (this.isWinner(row, col, this.HUMAN)) {
            this.playerScore++;
            this.highlightWinningCells();
            this.endGame('Báº¡n tháº¯ng!');
            return;
        }

        if (this.isDraw()) {
            this.endGame('HĂ²a!');
            return;
        }        // AI's move
        this.isProcessing = true;
        document.getElementById('status').textContent = 'LÆ°á»£t cá»§a mĂ¡y (X)...';
        
        // Use requestAnimationFrame for smoother UI updates
        requestAnimationFrame(() => {
            const aiMove = this.getBestMove();
            if (aiMove) {
                this.board[aiMove.row][aiMove.col] = this.AI;
                this.lastMove = aiMove;
                this.updateCell(aiMove.row, aiMove.col);

                if (this.isWinner(aiMove.row, aiMove.col, this.AI)) {
                    this.computerScore++;
                    this.highlightWinningCells();
                    this.endGame('MĂ¡y tháº¯ng!');
                    return;
                }

                if (this.isDraw()) {
                    this.endGame('HĂ²a!');
                    return;
                }
            }            this.isProcessing = false;
            document.getElementById('status').textContent = 'LÆ°á»£t cá»§a báº¡n (O)';
        });
    }

    isWinner(row, col, player) {
        const directions = [
            [[0, 1], [0, -1]], // Horizontal
            [[1, 0], [-1, 0]], // Vertical
            [[1, 1], [-1, -1]], // Main diagonal
            [[1, -1], [-1, 1]] // Anti-diagonal
        ];

        this.winningCells = [[row, col]];

        for (const direction of directions) {
            let count = 1;
            let cells = [[row, col]];
            
            for (const [dx, dy] of direction) {
                let r = row + dx;
                let c = col + dy;
                while (
                    r >= 0 && r < this.BOARD_SIZE && 
                    c >= 0 && c < this.BOARD_SIZE && 
                    this.board[r][c] === player
                ) {
                    count++;
                    cells.push([r, c]);
                    r += dx;
                    c += dy;
                }
            }

            if (count >= this.WINNING_LENGTH) {
                this.winningCells = cells.slice(0, this.WINNING_LENGTH);
                return true;
            }
        }

        this.winningCells = [];
        return false;
    }

    isDraw() {
        return this.board.every(row => row.every(cell => cell !== this.EMPTY));
    }    updateCell(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            // XĂ³a classes cÅ©
            cell.classList.remove('x', 'o', 'last-move');
            
            // ThĂªm ná»™i dung vĂ  class má»›i
            if (this.board[row][col] === this.AI) {
                cell.textContent = 'âœ•';
                cell.classList.add('x');
            } else if (this.board[row][col] === this.HUMAN) {
                cell.textContent = 'â—¯';
                cell.classList.add('o');
            } else {
                cell.textContent = '';
            }
            
            // ÄĂ¡nh dáº¥u nÆ°á»›c Ä‘i má»›i nháº¥t
            if (this.lastMove && this.lastMove.row === row && this.lastMove.col === col) {
                cell.classList.add('last-move');
            }
            
            // ThĂªm hiá»‡u á»©ng khi Ä‘Ă¡nh
            cell.style.transform = 'scale(0.8)';
            setTimeout(() => {
                cell.style.transform = 'scale(1)';
            }, 100);
        }
    }

    highlightWinningCells() {
        // Táº¡o hiá»‡u á»©ng highlight tá»«ng Ă´ má»™t
        this.winningCells.forEach(([row, col], index) => {
            setTimeout(() => {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.classList.add('win-cell');
                }
            }, index * 100); // Delay 100ms cho má»—i Ă´
        });
    }

    endGame(message) {
        this.gameOver = true;
        this.isProcessing = false;
        document.getElementById('status').textContent = message;
        document.getElementById('player-score').textContent = this.playerScore;
        document.getElementById('computer-score').textContent = this.computerScore;
    }    restart() {
        this.board = Array(this.BOARD_SIZE).fill().map(() => Array(this.BOARD_SIZE).fill(this.EMPTY));
        this.gameOver = false;
        this.isProcessing = false;
        this.winningCells = [];
        this.lastMove = null;
        this.initializeBoard();
        document.getElementById('status').textContent = 'LÆ°á»£t cá»§a báº¡n (O)';
    }

    hasAdjacentMark(row, col, range) {
        for (let i = -range; i <= range; i++) {
            for (let j = -range; j <= range; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = row + i;
                const newCol = col + j;
                if (
                    newRow >= 0 && newRow < this.BOARD_SIZE &&
                    newCol >= 0 && newCol < this.BOARD_SIZE &&
                    this.board[newRow][newCol] !== this.EMPTY
                ) {
                    return true;
                }
            }
        }
        return false;
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new CaroGame();
});