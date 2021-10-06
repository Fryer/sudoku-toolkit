export { startInput };


function startInput(board, panel) {
    board.resetInput = reset;
    
    board.addEventListener('mousedown', (event) => mouseDown(event, board, true));
    window.addEventListener('mousedown', (event) => mouseDown(event, board, false));
    window.addEventListener('mouseup', (event) => mouseUp(event, board));
    window.addEventListener('mousemove', (event) => mouseMove(event, board));
    window.addEventListener('keydown', (event) => keyDown(event, board));
    
    board.inputState = [];
    for (let i = 0; i < board.puzzle.size ** 2; i++) {
        board.inputState.push({ given: false, digit: '', center: new Set(), corner: new Set(), color: new Set() });
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
    for (let color of board.puzzle.colors) {
        let i = board.puzzle.cellIndex(color[1], color[2]);
        board.inputState[i].color = new Set(color[0]);
    }
    
    board.selectedCells = new Set();
    
    board.undoHistory = [];
    board.undoIndex = -1;
    pushUndo(board);
    
    panel.addEventListener('mousedown', event => event.stopPropagation());
    for (let button of panel.querySelectorAll('.digit-button')) {
        let digit = button.textContent;
        button.addEventListener('click', event => clickDigit(event, board, digit));
    }
    let undoButton = panel.querySelector('.undo-button');
    undoButton.addEventListener('click', event => clickUndo(event, board));
    let redoButton = panel.querySelector('.redo-button');
    redoButton.addEventListener('click', event => clickRedo(event, board));
    let deleteButton = panel.querySelector('.delete-button');
    deleteButton.addEventListener('click', event => clickDelete(event, board));
}


function reset() {
    this.inputState = [];
    for (let i = 0; i < board.puzzle.size ** 2; i++) {
        board.inputState.push({ given: false, digit: '', center: new Set(), corner: new Set(), color: new Set() });
    }
    for (let given of board.puzzle.givens) {
        let i = board.puzzle.cellIndex(given[1], given[2]);
        board.inputState[i].given = true;
    }
    updateDigits(this);
    deselectAll(this);
    pushUndo(board);
}


function clickDigit(event, board, digit) {
    let keyEvent = new KeyboardEvent('keydown', {
        code: `Digit${digit}`,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        repeat: false
    });
    keyDown(keyEvent, board);
}


function clickUndo(event, board) {
    let keyEvent = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        repeat: false
    });
    keyDown(keyEvent, board);
}


function clickRedo(event, board) {
    let keyEvent = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
        repeat: false
    });
    keyDown(keyEvent, board);
}


function clickDelete(event, board) {
    let keyEvent = new KeyboardEvent('keydown', {
        key: 'Delete',
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        repeat: false
    });
    keyDown(keyEvent, board);
}


function mouseDown(event, board, inside) {
    if (board.paused && !board.stopped) {
        return;
    }
    
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
    board.deletingSelection = event.altKey;
    if (!board.isInCell(x, y, 2)) {
        if (!event.ctrlKey && !event.shiftKey && !event.altKey) {
            deselectAll(board);
        }
        return;
    }
    
    let [column, row] = board.cellPosition(x, y);
    if (event.ctrlKey || event.shiftKey) {
        let i = board.puzzle.cellIndex(column, row);
        if (board.selectedCells.has(i)) {
            board.deletingSelection = true;
        }
    }
    
    if (board.selectedCells.size == 1) {
        let i = board.puzzle.cellIndex(column, row);
        let selectedIndex = board.selectedCells.values().next().value;
        if (i == selectedIndex && (board.deletingSelection || !(event.ctrlKey || event.shiftKey || event.altKey))) {
            // Clicked on last selected cell.
            deselectAll(board);
            if (board.deletingSelection) {
                delete board.selectionStart;
            }
            return;
        }
    }
    
    if (!event.ctrlKey && !event.shiftKey && !event.altKey) {
        deselectAll(board);
    }
    if (board.deletingSelection) {
        deselectCell(board, column, row);
    }
    else {
        selectCell(board, column, row);
    }
}


function mouseUp(event, board) {
    if (board.paused && !board.stopped) {
        return;
    }
    
    if (event.button == 0 && board.selectionStart) {
        delete board.selectionStart;
    }
}


function mouseMove(event, board) {
    if (board.paused && !board.stopped) {
        return;
    }
    
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
        if (!board.selectedCells.has(startIndex) && !board.deletingSelection) {
            selectCell(board, startColumn, startRow);
        }
    }
    
    if (!board.isInCell(x, y, 10)) {
        return;
    }
    
    let [column, row] = board.cellPosition(x, y);
    if (board.deletingSelection) {
        deselectCell(board, column, row);
    }
    else {
        selectCell(board, column, row);
    }
}


function keyDown(event, board) {
    if (board.paused && !board.stopped) {
        return;
    }
    
    let digitMatch = event.code.match(/^Digit(?<digit>[1-9])$/);
    let undoMatch = event.key.match(/^z$/i);
    let redoMatch = event.key.match(/^y$/i);
    let deleteMatch = event.key.match(/^(Backspace|Delete)$/);
    let arrowMatch = event.key.match(/^(Arrow(?<arrow>Left|Up|Right|Down))$/);
    let isInput = false;
    isInput ||= digitMatch && !event.altKey && !event.metaKey;
    isInput ||= undoMatch && event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
    isInput ||= redoMatch && event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
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
    
    if (digitMatch) {
        let digit = digitMatch.groups.digit;
        if (board.selectedCells.size != 0 && event.ctrlKey && event.shiftKey) {
            let hasColor = true;
            for (let i of board.selectedCells) {
                if (!board.inputState[i].color.has(digit)) {
                    hasColor = false;
                    break;
                }
            }
            if (hasColor) {
                for (let i of board.selectedCells) {
                    board.inputState[i].color.delete(digit);
                }
            }
            else {
                for (let i of board.selectedCells) {
                    board.inputState[i].color.add(digit);
                }
            }
            updateDigits(board);
            pushUndo(board);
            return;
        }
        let selectedCells = new Set();
        for (let i of board.selectedCells) {
            if (!board.inputState[i].given) {
                selectedCells.add(i);
            }
        }
        if (selectedCells.size == 0) {
            return;
        }
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
        pushUndo(board);
        return;
    }
    
    if (undoMatch) {
        undo(board);
        return;
    }
    
    if (redoMatch) {
        redo(board);
        return;
    }
    
    if (deleteMatch) {
        if (board.selectedCells.size == 0) {
            return;
        }
        let deleteDigit = true;
        let deleteCenter = true;
        let deleteCorner = true;
        let deleteColor = true;
        if (event.ctrlKey && event.shiftKey) {
            deleteDigit = false;
            deleteCenter = false;
            deleteCorner = false;
            deleteColor = true;
        }
        else if (event.ctrlKey) {
            deleteDigit = false;
            deleteCenter = true;
            deleteCorner = false;
            deleteColor = false;
        }
        else if (event.shiftKey) {
            deleteDigit = false;
            deleteCenter = false;
            deleteCorner = true;
            deleteColor = false;
        }
        else {
            for (let i of board.selectedCells) {
                if (board.inputState[i].digit != '') {
                    deleteCenter = false;
                    deleteCorner = false;
                    deleteColor = false;
                }
                else if (board.inputState[i].center.size > 0) {
                    deleteCorner = false;
                    deleteColor = false;
                }
                else if (board.inputState[i].corner.size > 0) {
                    deleteColor = false;
                }
            }
        }
        for (let i of board.selectedCells) {
            if (deleteDigit) {
                board.inputState[i].digit = '';
            }
            if (deleteCenter) {
                board.inputState[i].center = new Set();
            }
            if (deleteCorner) {
                board.inputState[i].corner = new Set();
            }
            if (deleteColor) {
                board.inputState[i].color = new Set();
            }
        }
        updateDigits(board);
        pushUndo(board);
        return;
    }
    
    if (arrowMatch && !board.selectionStart) {
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
            if (board.inputState[i].given) {
                continue;
            }
            if (board.inputState[i].digit) {
                board.puzzle.digits.push([board.inputState[i].digit, column, row]);
            }
        }
    }
    
    board.puzzle.centerMarks = [];
    for (let column = 1; column <= board.puzzle.size; column++) {
        for (let row = 1; row <= board.puzzle.size; row++) {
            let i = board.puzzle.cellIndex(column, row);
            if (board.inputState[i].given || board.inputState[i].digit) {
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
            if (board.inputState[i].given || board.inputState[i].digit) {
                continue;
            }
            if (board.inputState[i].corner.size > 0) {
                board.puzzle.cornerMarks.push([[...board.inputState[i].corner.values()].sort(), column, row]);
            }
        }
    }
    
    const COLORS = [
        '#ff20207f',
        '#ff8f207f',
        '#ffdf207f',
        '#8fff207f',
        '#20df207f',
        '#20dfff7f',
        '#2060ff7f',
        '#df20ff7f',
        '#4040407f'
    ];
    board.puzzle.colors = [];
    for (let column = 1; column <= board.puzzle.size; column++) {
        for (let row = 1; row <= board.puzzle.size; row++) {
            let i = board.puzzle.cellIndex(column, row);
            if (board.inputState[i].color.size > 0) {
                let colorDigits = [...board.inputState[i].color.values()].sort();
                board.puzzle.colors.push([colorDigits.map(digit => COLORS[digit - 1]), column, row]);
            }
        }
    }
    
    board.redrawDigits();
}


function copyInputState(state) {
    return state.map(cell => ({
        given: cell.given,
        digit: cell.digit,
        center: new Set(cell.center),
        corner: new Set(cell.corner),
        color: new Set(cell.color)
    }));
}


function pushUndo(board) {
    board.undoIndex++;
    board.undoHistory[board.undoIndex] = {
        inputState: copyInputState(board.inputState),
        selectedCells: new Set(board.selectedCells),
        cursor: (board.cursor ? [board.cursor.row, board.cursor.column] : undefined)
    };
    board.undoHistory.splice(board.undoIndex + 1);
}


function undo(board) {
    if (board.undoIndex < 1) {
        return;
    }
    board.undoIndex--;
    
    board.inputState = copyInputState(board.undoHistory[board.undoIndex].inputState);
    updateDigits(board);
    if (board.cursor) {
        board.removeChild(board.cursor.selection);
        delete board.cursor;
    }
    
    board.selectedCells = new Set(board.undoHistory[board.undoIndex].selectedCells);
    let cursor = board.undoHistory[board.undoIndex].cursor;
    if (cursor === undefined) {
        deselectAll(board);
    }
    else {
        updateSelection(board, cursor[0], cursor[1]);
    }
}


function redo(board) {
    if (board.undoIndex >= board.undoHistory.length - 1) {
        return;
    }
    board.undoIndex++;
    
    board.inputState = copyInputState(board.undoHistory[board.undoIndex].inputState);
    updateDigits(board);
    if (board.cursor) {
        board.removeChild(board.cursor.selection);
        delete board.cursor;
    }
    
    board.selectedCells = new Set(board.undoHistory[board.undoIndex].selectedCells);
    let cursor = board.undoHistory[board.undoIndex].cursor;
    if (cursor === undefined) {
        deselectAll(board);
    }
    else {
        updateSelection(board, cursor[0], cursor[1]);
    }
}
