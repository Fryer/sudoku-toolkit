export { startTimer };


function startTimer(board, panel) {
    let pauseButton = panel.querySelector('.pause-button');
    let timeField = panel.querySelector('.timer-time');
    let resetButton = panel.querySelector('.reset-button');
    
    panel.addEventListener('mousedown', event => event.stopPropagation());
    pauseButton.addEventListener('click', () => clickPause(board, pauseButton, timeField));
    resetButton.addEventListener('click', () => clickReset(board, pauseButton, timeField));
    
    board.time = 0;
    timeField.value = '0:00';
    unpause(board, timeField);
}


function clickPause(board, pauseButton, timeField) {
    if (board.paused) {
        unpause(board, timeField);
    }
    else {
        pause(board, timeField);
    }
    
    pauseButton.textContent = board.paused ? '\u25b6\ufe0e' : '\u23f8\ufe0e';
    pauseButton.className = board.paused ? 'play-button' : 'pause-button';
}


function clickReset(board, pauseButton, timeField) {
    board.resetInput();
    
    cancelAnimationFrame(board.timerFrameRequest);
    board.time = 0;
    timeField.value = '0:00';
    unpause(board, timeField);
}


function pause(board, timeField) {
    update(board, timeField);
    board.paused = true;
    cancelAnimationFrame(board.timerFrameRequest);
}


function unpause(board, timeField) {
    board.paused = false;
    board.lastTimeUpdate = performance.now();
    updateLoop(board, timeField);
}


function updateLoop(board, timeField) {
    update(board, timeField);
    board.timerFrameRequest = requestAnimationFrame(() => updateLoop(board, timeField));
}


function update(board, timeField) {
    let lastSeconds = Math.floor(board.time / 1000);
    let dt = performance.now() - board.lastTimeUpdate;
    board.time += dt;
    board.lastTimeUpdate += dt;
    
    let seconds = Math.floor(board.time / 1000);
    if (seconds == lastSeconds) {
        return;
    }
    
    let timeString = '';
    if (seconds > 3600) {
        timeString += `${Math.floor(seconds / 3600)}:`;
        timeString += `${Math.floor(seconds / 60) % 60}:`.padStart(3, 0);
    }
    else {
        timeString += `${Math.floor(seconds / 60) % 60}:`.padStart(2, 0);
    }
    timeString += `${seconds % 60}`.padStart(2, 0);
    timeField.value = timeString;
}
