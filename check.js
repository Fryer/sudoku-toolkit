export { check };


function check(board) {
    for (let cell of board.inputState) {
        if (!cell.given && !cell.digit) {
            return;
        }
    }
    board.stopTimer();
}
