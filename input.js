export { startInput };


const DIGIT_MODE = 0;
const CORNER_MODE = 1;
const CENTER_MODE = 2;
const COLOR_MODE = 3;


function startInput(board, panel) {
    board.resetInput = reset;
    
    board.addEventListener('pointerdown', (event) => mouseDown(event, board, true));
    window.addEventListener('pointerdown', (event) => mouseDown(event, board, false));
    window.addEventListener('pointerup', (event) => mouseUp(event, board));
    window.addEventListener('pointermove', (event) => mouseMove(event, board));
    window.addEventListener('keydown', (event) => keyDown(event, board));
    window.addEventListener('keyup', (event) => keyUp(event, board));
    
    board.inputState = [];
    for (let i = 0; i < board.puzzle.size ** 2; i++) {
        board.inputState.push({ given: 0, digit: '', center: new Set(), corner: new Set(), color: new Set() });
    }
    for (let given of board.puzzle.givens) {
        let i = board.puzzle.cellIndex(given[1], given[2]);
        board.inputState[i].given = given[0];
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
    
    board.lastUndo = copyInputState(board.inputState);
    board.undoHistory = [];
    board.undoIndex = -1;
    
    panel.addEventListener('pointerdown', event => event.stopPropagation());
    for (let button of panel.querySelectorAll('.digit-button, .center-button, .corner-button, .color-button')) {
        let digit = button.textContent;
        button.addEventListener('click', event => clickDigit(event, board, digit));
    }
    let undoButton = panel.querySelector('.undo-button');
    undoButton.addEventListener('click', event => clickUndo(event, board));
    let redoButton = panel.querySelector('.redo-button');
    redoButton.addEventListener('click', event => clickRedo(event, board));
    let deleteButton = panel.querySelector('.delete-button');
    deleteButton.addEventListener('click', event => clickDelete(event, board));
    
    board.inputMode = DIGIT_MODE;
    board.modifiedInputMode = DIGIT_MODE;
    board.inputModes = [
        {
            button: panel.querySelector('.digit-mode-button'),
            panel: panel.querySelector('.digit-panel')
        },
        {
            button: panel.querySelector('.corner-mode-button'),
            panel: panel.querySelector('.corner-panel')
        },
        {
            button: panel.querySelector('.center-mode-button'),
            panel: panel.querySelector('.center-panel')
        },
        {
            button: panel.querySelector('.color-mode-button'),
            panel: panel.querySelector('.color-panel')
        },
    ];
    for (let [i, mode] of board.inputModes.entries()) {
        mode.button.addEventListener('click', event => clickMode(event, board, i));
    }
}


function reset() {
    this.inputState = [];
    for (let i = 0; i < board.puzzle.size ** 2; i++) {
        board.inputState.push({ given: 0, digit: '', center: new Set(), corner: new Set(), color: new Set() });
    }
    for (let given of board.puzzle.givens) {
        let i = board.puzzle.cellIndex(given[1], given[2]);
        board.inputState[i].given = given[0];
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


function clickMode(event, board, mode) {
    switch (mode) {
        case DIGIT_MODE:
            keyDown(new KeyboardEvent('keydown', { key: 'z' }), board);
            break;
        case CORNER_MODE:
            keyDown(new KeyboardEvent('keydown', { key: 'x' }), board);
            break;
        case CENTER_MODE:
            keyDown(new KeyboardEvent('keydown', { key: 'c' }), board);
            break;
        case COLOR_MODE:
            keyDown(new KeyboardEvent('keydown', { key: 'v' }), board);
            break;
    }
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
    digitMatch = (!event.altKey && !event.metaKey) ? digitMatch : false;
    let undoMatch = event.key.match(/^z$/);
    undoMatch = (event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) ? undoMatch : false;
    let redoMatch = event.key.match(/^y$/);
    redoMatch = (event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) ? redoMatch : false;
    let deleteMatch = event.key.match(/^(Backspace|Delete)$/);
    deleteMatch = (!event.altKey && !event.metaKey) ? deleteMatch : false;
    let modeMatch = event.key.match(/^[zxcv]$/);
    modeMatch = (!event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) ? modeMatch : false;
    let modeModifierMatch = event.key.match(/^(Control|Shift)$/);
    let arrowMatch = event.key.match(/^(Arrow(?<arrow>Left|Up|Right|Down))$/);
    arrowMatch = (!event.metaKey) ? arrowMatch : false;
    let selectAllMatch = event.key == 'a' && event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
    let deselectMatch = event.key == 'd' && event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
    deselectMatch ||= event.key == 'Escape' && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
    let isInput = false;
    isInput ||= digitMatch;
    isInput ||= undoMatch;
    isInput ||= redoMatch;
    isInput ||= deleteMatch;
    isInput ||= modeMatch;
    isInput ||= modeModifierMatch;
    isInput ||= arrowMatch;
    isInput ||= selectAllMatch;
    isInput ||= deselectMatch;
    if (!isInput) {
        return;
    }
    event.preventDefault();
    
    if (event.repeat && !arrowMatch) {
        return;
    }
    
    if (digitMatch) {
        let digit = digitMatch.groups.digit;
        if (board.selectedCells.size != 0 && board.modifiedInputMode == COLOR_MODE) {
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
        if (board.modifiedInputMode == CENTER_MODE) {
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
        else if (board.modifiedInputMode == CORNER_MODE) {
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
        if (board.modifiedInputMode == COLOR_MODE) {
            deleteDigit = false;
            deleteCenter = false;
            deleteCorner = false;
            deleteColor = true;
        }
        else if (board.modifiedInputMode == CENTER_MODE) {
            deleteDigit = false;
            deleteCenter = true;
            deleteCorner = false;
            deleteColor = false;
        }
        else if (board.modifiedInputMode == CORNER_MODE) {
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
    
    if (modeMatch) {
        switch (modeMatch[0]) {
            case 'z':
                board.inputMode = DIGIT_MODE;
                board.modifiedInputMode = DIGIT_MODE;
                break;
            case 'x':
                board.inputMode = CORNER_MODE;
                board.modifiedInputMode = CORNER_MODE;
                break;
            case 'c':
                board.inputMode = CENTER_MODE;
                board.modifiedInputMode = CENTER_MODE;
                break;
            case 'v':
                board.inputMode = COLOR_MODE;
                board.modifiedInputMode = COLOR_MODE;
                break;
        }
        for (let mode of board.inputModes) {
            mode.button.classList.add('toggle-off');
            mode.panel.style.display = 'none';
        }
        board.inputModes[board.inputMode].button.classList.remove('toggle-off');
        board.inputModes[board.inputMode].panel.style.display = '';
        return;
    }
    
    if (modeModifierMatch) {
        if (event.ctrlKey && event.shiftKey) {
            board.modifiedInputMode = COLOR_MODE;
        }
        else if (event.ctrlKey) {
            board.modifiedInputMode = CENTER_MODE;
        }
        else {
            board.modifiedInputMode = CORNER_MODE;
        }
        for (let mode of board.inputModes) {
            mode.button.classList.add('toggle-off');
            mode.panel.style.display = 'none';
        }
        board.inputModes[board.modifiedInputMode].button.classList.remove('toggle-off');
        board.inputModes[board.modifiedInputMode].panel.style.display = '';
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
    
    if (selectAllMatch) {
        for (let i = 0; i < board.inputState.length; i++) {
            board.selectedCells.add(i);
        }
        selectCell(board, 1, 1);
    }
    
    if (deselectMatch) {
        deselectAll(board);
    }
}

function keyUp(event, board) {
    if (board.paused && !board.stopped) {
        return;
    }
    
    if (!event.key.match(/^(Control|Shift)$/)) {
        return;
    }
    event.preventDefault();
    
    if (event.ctrlKey) {
        board.modifiedInputMode = CENTER_MODE;
    }
    else if (event.shiftKey) {
        board.modifiedInputMode = CORNER_MODE;
    }
    else {
        board.modifiedInputMode = board.inputMode;
    }
    for (let mode of board.inputModes) {
        mode.button.classList.add('toggle-off');
        mode.panel.style.display = 'none';
    }
    board.inputModes[board.modifiedInputMode].button.classList.remove('toggle-off');
    board.inputModes[board.modifiedInputMode].panel.style.display = '';
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
        '#20bf207f',
        '#20dfdf7f',
        '#207fff7f',
        '#8f40ff7f',
        '#7f7f7f7f',
        '#2020207f'
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
    board.dispatchEvent(new Event('puzzleinput'));
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


function computeInputStateDelta(beforeState, afterState) {
    let delta = {};
    for (let [i, beforeCell] of beforeState.entries()) {
        let afterCell = afterState[i];
        let deltaCell = { digit: [], center: [], corner: [], color: []};
        if (afterCell.digit != beforeCell.digit) {
            deltaCell.digit = [beforeCell.digit, afterCell.digit];
        }
        for (let digit = 1; digit <= board.puzzle.size; digit++) {
            let digitString = digit.toString();
            if (afterCell.center.has(digitString) != beforeCell.center.has(digitString)) {
                deltaCell.center.push(digitString);
            }
            if (afterCell.corner.has(digitString) != beforeCell.corner.has(digitString)) {
                deltaCell.corner.push(digitString);
            }
            if (afterCell.color.has(digitString) != beforeCell.color.has(digitString)) {
                deltaCell.color.push(digitString);
            }
        }
        if (deltaCell.digit.length + deltaCell.center.length + deltaCell.corner.length + deltaCell.color.length > 0) {
            delta[i] = deltaCell;
        }
    }
    return delta;
}


function applyInputStateDelta(inputState, delta) {
    for (let [i, deltaCell] of Object.entries(delta)) {
        let cell = inputState[i];
        if (deltaCell.digit.length == 2) {
            cell.digit = (cell.digit == deltaCell.digit[0]) ? deltaCell.digit[1] : deltaCell.digit[0];
        }
        for (let digit of deltaCell.center) {
            if (cell.center.has(digit)) {
                cell.center.delete(digit);
            }
            else {
                cell.center.add(digit);
            }
        }
        for (let digit of deltaCell.corner) {
            if (cell.corner.has(digit)) {
                cell.corner.delete(digit);
            }
            else {
                cell.corner.add(digit);
            }
        }
        for (let digit of deltaCell.color) {
            if (cell.color.has(digit)) {
                cell.color.delete(digit);
            }
            else {
                cell.color.add(digit);
            }
        }
    }
}


function pushUndo(board) {
    let delta = computeInputStateDelta(board.lastUndo, board.inputState);
    if (Object.entries(delta).length == 0) {
        return;
    }
    
    board.undoIndex++;
    board.undoHistory[board.undoIndex] = {
        deltaState: delta,
        selectedCells: new Set(board.selectedCells),
        cursor: (board.cursor ? [board.cursor.column, board.cursor.row] : undefined)
    };
    board.undoHistory.splice(board.undoIndex + 1);
    board.lastUndo = copyInputState(board.inputState);
}


function undo(board) {
    if (board.undoIndex < 0) {
        return;
    }
    
    applyInputStateDelta(board.inputState, board.undoHistory[board.undoIndex].deltaState);
    board.lastUndo = copyInputState(board.inputState);
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
    
    board.undoIndex--;
}


function redo(board) {
    if (board.undoIndex >= board.undoHistory.length - 1) {
        return;
    }
    board.undoIndex++;
    
    applyInputStateDelta(board.inputState, board.undoHistory[board.undoIndex].deltaState);
    board.lastUndo = copyInputState(board.inputState);
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
