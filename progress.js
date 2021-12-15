export { initProgress };


async function initProgress(board) {
    async function handleRequest(request) {
        try {
            return await new Promise((resolve, reject) => {
                request.addEventListener('upgradeneeded', () => {
                    upgradeDB(request.result);
                });
                request.addEventListener('success', () => {
                    resolve(request.result);
                });
                request.addEventListener('error', () => {
                    reject(request.error);
                });
            });
        }
        catch (error) {
            if (error instanceof DOMException) {
                if (error.name != 'VersionError') {
                    console.log('Error creating progress database:', error.message);
                }
                return error;
            }
            throw error;
        }
    }
    
    let db = await handleRequest(indexedDB.open('sudoku-toolkit-progress', 2));
    if (!db) {
        return;
    }
    db.close();
    
    await loadProgress(board);
    board.addEventListener('puzzleinput', () => saveProgress(board));
    window.addEventListener('beforeunload', () => saveProgress(board, true));
    document.addEventListener('visibilitychange', () => saveProgress(board, true));
}


async function saveProgress(board, onlyTime) {
    if (onlyTime && !board.lastProgress) {
        return;
    }
    
    if (board.savingProgress) {
        // Save already in progress, queue after.
        if (board.savingProgress.next) {
            // Cancel previously queued save.
            board.savingProgress.next.cancel();
        }
        try {
            await new Promise((resolve, reject) => {
                board.savingProgress.next = { start: resolve, cancel: reject };
            });
        }
        catch {
            return;
        }
    }
    board.savingProgress = {};
    
    async function handleRequest(request) {
        try {
            return await new Promise((resolve, reject) => {
                request.addEventListener('success', () => {
                    resolve(request.result);
                });
                request.addEventListener('error', () => {
                    reject(request.error);
                });
            });
        }
        catch (error) {
            if (board.savingProgress.next) {
                // Cancel queued save.
                board.savingProgress.next.cancel();
            }
            delete board.savingProgress;
            if (error instanceof DOMException) {
                console.log('Error saving progress:', error.message);
                return error;
            }
            throw error;
        }
    }
    
    let db = await handleRequest(indexedDB.open('sudoku-toolkit-progress'));
    if (!db) {
        return;
    }
    
    let transaction = db.transaction('progress', 'readwrite');
    let store = transaction.objectStore('progress');
    
    let progress = onlyTime ? board.lastProgress : encodeProgress(board);
    if (onlyTime) {
        progress.time = board.time;
        progress.stopped = board.stopped;
    }
    
    if (!await handleRequest(store.put(progress, board.puzzle.id))) {
        db.close();
        return;
    }
    
    db.close();
    
    if (!onlyTime) {
        board.lastProgress = progress;
    }
    
    // Start queued save.
    if(board.savingProgress.next) {
        board.savingProgress.next.start();
    }
    delete board.savingProgress;
}


async function loadProgress(board) {
    async function handleRequest(request) {
        try {
            return await new Promise((resolve, reject) => {
                request.addEventListener('success', () => {
                    resolve(request.result);
                });
                request.addEventListener('error', () => {
                    reject(request.error);
                });
            });
        }
        catch (error) {
            if (error instanceof DOMException) {
                console.log('Error loading progress:', error.message);
                return error;
            }
            throw error;
        }
    }
    
    let db = await handleRequest(indexedDB.open('sudoku-toolkit-progress'));
    if (!db) {
        return;
    }
    
    let transaction = db.transaction('progress');
    let store = transaction.objectStore('progress');
    
    let progress = await handleRequest(store.get(board.puzzle.id));
    if (!progress) {
        db.close();
        return;
    }
    
    decodeProgress(board, progress);
    board.lastProgress = progress;
    
    db.close();
}


function upgradeDB(db) {
    db.createObjectStore('progress');
}


function encodeProgress(board) {
    let progress = {
        version: 2,
        inputState: [],
        undoHistory: [],
        undoIndex: board.undoIndex,
        time: board.time,
        stopped: board.stopped
    };
    
    let inputState = board.lastUndo.map(cell => {
        if (cell.center.size == 0 && cell.corner.size == 0 && cell.color.size == 0) {
            return cell.digit;
        }
        return [cell.digit, [...cell.center].join(''), [...cell.corner].join(''), [...cell.color].join('')];
    });
    
    let undoHistory = board.undoHistory.map(step => {
        let deltaState = Object.entries(step.deltaState).map(entry => {
            let [i, cell] = entry;
            return [i, cell.digit.join(','), cell.center.join(''), cell.corner.join(''), cell.color.join('')];
        });
        if (deltaState.length == 1) {
            deltaState = deltaState[0];
        }
        let selectedCells = [...step.selectedCells];
        if (selectedCells.length == 1) {
            selectedCells = selectedCells[0];
        }
        return [deltaState, selectedCells, step.cursor];
    });
    
    progress.inputState = LZString.compressToUTF16(JSON.stringify(inputState));
    progress.undoHistory = LZString.compressToUTF16(JSON.stringify(undoHistory));
    
    return progress;
}


function decodeProgress(board, progress) {
    board.undoIndex = progress.undoIndex;
    if (progress.stopped) {
        board.stopTimer();
    }
    board.time = progress.time;
    board.updateTimer();
    
    let inputState = progress.inputState;
    let undoHistory = progress.undoHistory;
    if (progress.version >= 2) {
        inputState = JSON.parse(LZString.decompressFromUTF16(inputState));
        undoHistory = JSON.parse(LZString.decompressFromUTF16(undoHistory));
    }
    
    board.inputState = inputState.map((cell, i) => {
        let given = board.inputState[i].given;
        if (cell instanceof Array) {
            return {
                given: given,
                digit: cell[0],
                center: new Set(cell[1].split('')),
                corner: new Set(cell[2].split('')),
                color: new Set(cell[3].split(''))
            };
        }
        return { given: given, digit: cell, center: new Set(), corner: new Set(), color: new Set() };
    });
    board.lastUndo = board.inputState.map(cell => ({
        given: cell.given,
        digit: cell.digit,
        center: new Set(cell.center),
        corner: new Set(cell.corner),
        color: new Set(cell.color)
    }));
    
    board.undoHistory = undoHistory.map(step => {
        let deltaState;
        if (step[0].length == 0 || step[0][0] instanceof Array) {
            deltaState = Object.fromEntries(step[0].map(entry => {
                return [entry[0], {
                    digit: entry[1].split(','),
                    center: entry[2].split(''),
                    corner: entry[3].split(''),
                    color: entry[4].split('')
                }];
            }));
        }
        else {
            deltaState = { [step[0][0]]: {
                digit: step[0][1].split(','),
                center: step[0][2].split(''),
                corner: step[0][3].split(''),
                color: step[0][4].split('')
            } };
        }
        let selectedCells;
        if (step[1] instanceof Array) {
            selectedCells = new Set(step[1]);
        }
        else {
            selectedCells = new Set([step[1]]);
        }
        return {
            deltaState: deltaState,
            selectedCells: selectedCells,
            cursor: step[2]
        };
    });
    
    board.updateDigits();
}
