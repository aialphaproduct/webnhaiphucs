class CaroGame {    constructor() {
        this.BOARD_SIZE = 15; // Tăng kích thước bàn cờ lên 15x15
        this.EMPTY = '';
        this.HUMAN = 'O';
        this.AI = 'X';
        this.WINNING_LENGTH = 5; // Số quân liên tiếp để thắng là 5
        
        // Hệ số điểm cho các mẫu tấn công
        this.ATTACK_SCORES = {            WIN: 100000,        // Thắng (5 quân liên tiếp)
            FOUR_OPEN: 15000,  // 4 quân 2 đầu mở
            FOUR_CLOSED: 5000, // 4 quân 1 đầu mở
            THREE_OPEN: 3000,  // 3 quân 2 đầu mở
            TWO_CLOSED: 100,   // 2 quân 1 đầu mở
            ONE: 10,           // 1 quân
            DIAGONAL_BONUS: 1.5 // Hệ số cộng thêm cho đường chéo
        };

        // Hệ số điểm cho phòng thủ
        this.DEFENSE_SCORES = {            BLOCK_WIN: 90000,         // Chặn 5 quân
            BLOCK_FOUR_OPEN: 14000,   // Chặn 4 quân 2 đầu mở
            BLOCK_FOUR_CLOSED: 4500,  // Chặn 4 quân 1 đầu mở
            BLOCK_TWO_OPEN: 450,   // Chặn 2 quân 2 đầu mở
            DIAGONAL_BONUS: 1.3    // Hệ số cộng thêm cho đường chéo
        };

        // Khởi tạo bàn cờ
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
        let bestTotalScore = -Infinity; // Dùng cho xử lý trường hợp đồng hạng

        for (const move of candidateMoves) {
            // Thử nước đi
            this.board[move.row][move.col] = this.AI;
            
            // Tính điểm tấn công và phòng thủ
            const attackScore = this.evaluateAttack(move.row, move.col);
            const defenseScore = this.evaluateDefense(move.row, move.col);
            
            // Lấy điểm cao nhất giữa tấn công và phòng thủ
            const score = Math.max(attackScore, defenseScore);
            const totalScore = attackScore + defenseScore; // Dùng cho xử lý đồng hạng
            
            // Cập nhật nước đi tốt nhất
            if (score > bestScore || (score === bestScore && totalScore > bestTotalScore)) {
                bestScore = score;
                bestTotalScore = totalScore;
                bestMove = move;
            }
            
            // Hoàn tác nước đi thử
            this.board[move.row][move.col] = this.EMPTY;
        }

        return bestMove;
    }

    getCandidateMoves() {
        const moves = [];
        
        // Nước đi đầu tiên - đánh vào trung tâm hoặc xung quanh
        if (this.isBoardEmpty()) {
            const center = Math.floor(this.BOARD_SIZE / 2);
            return [{ row: center, col: center }];
        }

        // Tìm các ô trống có quân xung quanh
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
            [[1, 0], [-1, 0]],  // Dọc
            [[1, 1], [-1, -1]], // Chéo xuống
            [[1, -1], [-1, 1]]  // Chéo lên
        ];

        for (const [dir1, dir2] of directions) {
            const isDiagonal = Math.abs(dir1[0]) === 1 && Math.abs(dir1[1]) === 1;
            const pattern = this.getPattern(row, col, dir1, dir2, this.AI);
            
            // Tính điểm dựa trên mẫu
            let patternScore = this.getPatternScore(pattern, true);
            
            // Cộng thêm điểm cho đường chéo
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
            [[1, 0], [-1, 0]],  // Dọc
            [[1, 1], [-1, -1]], // Chéo xuống
            [[1, -1], [-1, 1]]  // Chéo lên
        ];

        for (const [dir1, dir2] of directions) {
            const isDiagonal = Math.abs(dir1[0]) === 1 && Math.abs(dir1[1]) === 1;
            const pattern = this.getPattern(row, col, dir1, dir2, this.HUMAN);
            
            // Tính điểm dựa trên mẫu
            let patternScore = this.getPatternScore(pattern, false);
            
            // Cộng thêm điểm cho đường chéo
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

        // Kiểm tra hướng thứ nhất
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

        // Kiểm tra hướng thứ hai
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
            this.endGame('Bạn thắng!');
            return;
        }

        if (this.isDraw()) {
            this.endGame('Hòa!');
            return;
        }        // AI's move
        this.isProcessing = true;
        document.getElementById('status').textContent = 'Lượt của máy (X)...';
        
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
                    this.endGame('Máy thắng!');
                    return;
                }

                if (this.isDraw()) {
                    this.endGame('Hòa!');
                    return;
                }
            }            this.isProcessing = false;
            document.getElementById('status').textContent = 'Lượt của bạn (O)';
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
            // Xóa classes cũ
            cell.classList.remove('x', 'o', 'last-move');
            
            // Thêm nội dung và class mới
            if (this.board[row][col] === this.AI) {
                cell.textContent = '✕';
                cell.classList.add('x');
            } else if (this.board[row][col] === this.HUMAN) {
                cell.textContent = '◯';
                cell.classList.add('o');
            } else {
                cell.textContent = '';
            }
            
            // Đánh dấu nước đi mới nhất
            if (this.lastMove && this.lastMove.row === row && this.lastMove.col === col) {
                cell.classList.add('last-move');
            }
            
            // Thêm hiệu ứng khi đánh
            cell.style.transform = 'scale(0.8)';
            setTimeout(() => {
                cell.style.transform = 'scale(1)';
            }, 100);
        }
    }

    highlightWinningCells() {
        // Tạo hiệu ứng highlight từng ô một
        this.winningCells.forEach(([row, col], index) => {
            setTimeout(() => {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.classList.add('win-cell');
                }
            }, index * 100); // Delay 100ms cho mỗi ô
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
        document.getElementById('status').textContent = 'Lượt của bạn (O)';
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
