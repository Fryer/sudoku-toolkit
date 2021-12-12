export { check };


function check(board) {
    let checkRegions = true;
    for (let i = 0; i < board.puzzle.size; i++) {
        if (board.puzzle.regions[i].length != board.puzzle.size) {
            checkRegions = false;
            break;
        }
    }
    
    let columnDigits = [];
    let rowDigits = [];
    let regionDigits = [];
    for (let i = 0; i < board.puzzle.size; i++) {
        columnDigits.push({});
        rowDigits.push({});
        regionDigits.push({});
    }
    
    let warnings = new Set();
    let errors = new Set();
    for (let [i, cell] of board.inputState.entries()) {
        if (!cell.given && !cell.digit) {
            warnings.add(i);
            continue;
        }
        let [column, row] = board.puzzle.cellPosition(i);
        let column0 = column - 1;
        let row0 = row - 1;
        let region = board.puzzle.cellRegions[i];
        let digit = cell.given || cell.digit;
        if (columnDigits[column0][digit]) {
            errors.add(columnDigits[column0][digit]);
            errors.add(i);
        }
        if (rowDigits[row0][digit]) {
            errors.add(rowDigits[row0][digit]);
            errors.add(i);
        }
        if (checkRegions && regionDigits[region][digit]) {
            errors.add(regionDigits[region][digit]);
            errors.add(i);
        }
        columnDigits[column0][digit] = i;
        rowDigits[row0][digit] = i;
        regionDigits[region][digit] = i;
    }
    
    if (errors.size > 0) {
        board.puzzle.errors = [];
        for (let i of errors) {
            board.puzzle.errors.push(board.puzzle.cellPosition(i));
        }
        board.redrawDigits();
    }
    else if (warnings.size > 0) {
        board.puzzle.errors = [];
        for (let i of warnings) {
            board.puzzle.errors.push(board.puzzle.cellPosition(i));
        }
        board.redrawDigits();
    }
    else {
        board.stopTimer();
        board.puzzle.complete = true;
        board.redrawDigits();
    }
}
