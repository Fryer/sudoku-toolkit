export { startInput };


function startInput(board) {
    board.addEventListener('mousedown', (event) => mouseDown(event, board, true));
    window.addEventListener('mousedown', (event) => mouseDown(event, board, false));
    window.addEventListener('mouseup', (event) => mouseUp(event, board));
    window.addEventListener('mousemove', (event) => mouseMove(event, board));
    window.addEventListener('keydown', (event) => keyPress(event, board));
    
    board.inputState = [];
    for (let i = 0; i < board.puzzle.size ** 2; i++) {
        board.inputState.push({ given: false, digit: '', center: new Set(), corner: new Set() });
    }
    for (let given of board.puzzle.givens) {
        let i = board.puzzle.cellIndex(given[1], given[2]);
        board.inputState[i].given = true;
    }
    for (let digit of board.puzzle.digits) {
        let i = board.puzzle.cellIndex(digit[1], digit[2]);
        board.inputState[i].digit = digit[0];
    }
    for (let center of board.puzzle.centerMarks) {
        let i = board.puzzle.cellIndex(center[1], center[2]);
        board.inputState[i].center = new Set(center[0]);
    }
    for (let corner of board.puzzle.cornerMarks) {
        let i = board.puzzle.cellIndex(corner[1], corner[2]);
        board.inputState[i].corner = new Set(corner[0]);
    }
    
    board.selectedCells = new Set();
}


function mouseDown(event, board, inside) {
    if (event.button != 0) {
        if (board.selectionStart) {
            delete board.selectionStart;
        }
        return;
    }
    if (inside) {
        event.stopPropagation();
    }
    
    let x = event.clientX;
    let y = event.clientY;
    if (!inside) {
        deselectAll(board);
        return;
    }
    board.selectionStart = [x, y];
    if (!board.isInCell(x, y, 2)) {
        if (!event.ctrlKey && !event.shiftKey && !event.altKey) {
            deselectAll(board);
        }
        return;
    }
    
    let [column, row] = board.cellPosition(x, y);
    if (board.selectedCells.size == 1) {
        let i = board.selectedCells.values().next().value;
        let [selectedColumn, selectedRow] = board.puzzle.cellPosition(i);
        if (column == selectedColumn && row == selectedRow) {
            // Clicked on last selected cell.
            if (!event.ctrlKey && !event.shiftKey) {
                deselectAll(board);
            }
            return;
        }
    }
    if (!event.ctrlKey && !event.shiftKey) {
        if (event.altKey) {
            deselectCell(board, column, row);
        }
        else {
            deselectAll(board);
        }
    }
    if (!event.altKey) {
        selectCell(board, column, row);
    }
}


function mouseUp(event, board) {
    if (event.button == 0 && board.selectionStart) {
        delete board.selectionStart;
    }
}


function mouseMove(event, board) {
    if ((event.buttons & 1) == 0) {
        if (board.selectionStart) {
            delete board.selectionStart;
        }
        return;
    }
    if (!board.selectionStart) {
        return;
    }
    
    let x = event.clientX;
    let y = event.clientY;
    if ((x - board.selectionStart[0]) ** 2 + (y - board.selectionStart[1]) ** 2 < 100) {
        // Not far enough from selection start.
        return;
    }
    
    if (board.isInCell(board.selectionStart[0], board.selectionStart[1], 2)) {
        let [startColumn, startRow] = board.cellPosition(...board.selectionStart);
        let startIndex = board.puzzle.cellIndex(startColumn, startRow);
        if (!board.selectedCells.has(startIndex)) {
            if (event.altKey) {
                deselectCell(board, startColumn, startRow);
            }
            else {
                selectCell(board, startColumn, startRow);
            }
        }
    }
    
    if (!board.isInCell(x, y, 10)) {
        return;
    }
    
    let [column, row] = board.cellPosition(x, y);
    if (event.altKey) {
        deselectCell(board, column, row);
    }
    else {
        selectCell(board, column, row);
    }
}


function keyPress(event, board) {
    let digitMatch = event.code.match(/^Digit(?<digit>[1-9])$/);
    let deleteMatch = event.key.match(/^(Backspace|Delete)$/);
    let arrowMatch = event.key.match(/^(Arrow(?<arrow>Left|Up|Right|Down))$/);
    let isInput = false;
    isInput ||= digitMatch && !event.altKey && !event.metaKey;
    isInput ||= deleteMatch && !event.altKey && !event.metaKey;
    isInput ||= arrowMatch && !event.metaKey;
    isInput ||= event.key == 'a' && event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
    isInput ||= event.key == 'd' && event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
    isInput ||= event.key == 'Escape' && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
    if (!isInput) {
        return;
    }
    event.preventDefault();
    
    if (event.repeat && !arrowMatch) {
        return;
    }
    
    let selectedCells = new Set();
    for (let i of board.selectedCells) {
        if (!board.inputState[i].given) {
            selectedCells.add(i);
        }
    }
    
    if (digitMatch) {
        if (selectedCells.size == 0) {
            return;
        }
        let digit = digitMatch.groups.digit;
        if (event.ctrlKey) {
            let hasMark = true;
            for (let i of selectedCells) {
                if (!board.inputState[i].center.has(digit)) {
                    hasMark = false;
                    break;
                }
            }
            if (hasMark) {
                for (let i of selectedCells) {
                    board.inputState[i].center.delete(digit);
                }
            }
            else {
                for (let i of selectedCells) {
                    board.inputState[i].center.add(digit);
                }
            }
        }
        else if (event.shiftKey) {
            let hasMark = true;
            for (let i of selectedCells) {
                if (!board.inputState[i].corner.has(digit)) {
                    hasMark = false;
                    break;
                }
            }
            if (hasMark) {
                for (let i of selectedCells) {
                    board.inputState[i].corner.delete(digit);
                }
            }
            else {
                for (let i of selectedCells) {
                    board.inputState[i].corner.add(digit);
                }
            }
        }
        else {
            for (let i of selectedCells) {
                board.inputState[i].digit = digit;
            }
        }
        updateDigits(board);
        return;
    }
    
    if (deleteMatch) {
        if (selectedCells.size == 0) {
            return;
        }
        let deleteDigit = true;
        let deleteCenter = true;
        let deleteCorner = true;
        for (let i of selectedCells) {
            if (board.inputState[i].digit != '') {
                deleteCenter = false;
                deleteCorner = false;
                break;
            }
            if (board.inputState[i].center.size > 0) {
                deleteCorner = false;
            }
        }
        if (event.ctrlKey) {
            deleteDigit = false;
            deleteCenter = true;
        }
        if (event.shiftKey) {
            deleteDigit = false;
            deleteCorner = true;
        }
        for (let i of selectedCells) {
            if (deleteDigit) {
                board.inputState[i].digit = '';
            }
            if (deleteCenter) {
                board.inputState[i].center = new Set();
            }
            if (deleteCorner) {
                board.inputState[i].corner = new Set();
            }
        }
        updateDigits(board);
        return;
    }
    
    if (arrowMatch) {
        if (!board.cursor && !event.altKey) {
            selectCell(board, 1, 1);
            return;
        }
        let arrow = arrowMatch.groups.arrow;
        let column = board.cursor.column;
        let row = board.cursor.row;
        switch (arrow) {
            case 'Left':
                column--;
                if (column < 1) {
                    column = board.puzzle.size;
                }
                break;
            case 'Up':
                row--;
                if (row < 1) {
                    row = board.puzzle.size;
                }
                break;
            case 'Right':
                column++;
                if (column > board.puzzle.size) {
                    column = 1;
                }
                break;
            case 'Down':
                row++;
                if (row > board.puzzle.size) {
                    row = 1;
                }
                break;
        }
        if (!event.ctrlKey && !event.shiftKey && !event.altKey) {
            deselectAll(board);
        }
        if (event.altKey) {
            deselectCell(board, column, row);
        }
        else {
            selectCell(board, column, row);
        }
        return;
    }
    
    if (event.key == 'a' && event.ctrlKey && !event.shiftKey && !event.altKey) {
        for (let i = 0; i < board.inputState.length; i++) {
            board.selectedCells.add(i);
        }
        selectCell(board, 1, 1);
    }
    
    if (event.key == 'd' && event.ctrlKey && !event.shiftKey && !event.altKey) {
        deselectAll(board);
    }
    if (event.key == 'Escape' && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        deselectAll(board);
    }
}


function toggleMark(set, digit) {
    if (set.has(digit)) {
        set.delete(digit);
    }
    else {
        set.add(digit);
    }
}


function selectCell(board, column, row) {
    if (board.cursor) {
        board.removeChild(board.cursor.selection);
        delete board.cursor;
    }
    board.selectedCells.add(board.puzzle.cellIndex(column, row));
    
    updateSelection(board, column, row);
}


function deselectCell(board, column, row) {
    if (board.cursor) {
        board.removeChild(board.cursor.selection);
        delete board.cursor;
    }
    board.selectedCells.delete(board.puzzle.cellIndex(column, row));
    
    updateSelection(board, column, row);
}


function deselectAll(board) {
    if (board.cursor) {
        board.removeChild(board.cursor.selection);
        delete board.cursor;
    }
    board.selectedCells = new Set();
}


function updateSelection(board, column, row) {
    let cells = [...board.selectedCells.values()].map(i => board.puzzle.cellPosition(i));
    let selection = board.drawSelection(cells);
    board.cursor = {
        selection: selection,
        column: column,
        row: row
    };
}


function updateDigits(board) {
    board.puzzle.digits = [];
    for (let column = 1; column <= board.puzzle.size; column++) {
        for (let row = 1; row <= board.puzzle.size; row++) {
            let i = board.puzzle.cellIndex(column, row);
            if (board.inputState[i].digit) {
                board.puzzle.digits.push([board.inputState[i].digit, column, row]);
            }
        }
    }
    
    board.puzzle.centerMarks = [];
    for (let column = 1; column <= board.puzzle.size; column++) {
        for (let row = 1; row <= board.puzzle.size; row++) {
            let i = board.puzzle.cellIndex(column, row);
            if (board.inputState[i].digit) {
                continue;
            }
            if (board.inputState[i].center.size > 0) {
                board.puzzle.centerMarks.push([[...board.inputState[i].center.values()].sort(), column, row]);
            }
        }
    }
    
    board.puzzle.cornerMarks = [];
    for (let column = 1; column <= board.puzzle.size; column++) {
        for (let row = 1; row <= board.puzzle.size; row++) {
            let i = board.puzzle.cellIndex(column, row);
            if (board.inputState[i].digit) {
                continue;
            }
            if (board.inputState[i].corner.size > 0) {
                board.puzzle.cornerMarks.push([[...board.inputState[i].corner.values()].sort(), column, row]);
            }
        }
    }
    
    board.redrawDigits();
}
