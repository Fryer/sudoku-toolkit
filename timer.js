export { startTimer };


function startTimer(board, panel, pauseOverlay) {
    let pauseButton = panel.querySelector('.pause-button');
    let timeField = panel.querySelector('.timer-time');
    let resetButton = panel.querySelector('.reset-button');
    
    panel.addEventListener('mousedown', event => event.stopPropagation());
    pauseButton.addEventListener('click', () => clickPause(board, pauseButton, timeField, pauseOverlay));
    resetButton.addEventListener('click', () => clickReset(board, pauseButton, timeField, pauseOverlay));
    pauseOverlay.addEventListener('click', () => clickPause(board, pauseButton, timeField, pauseOverlay));
    
    board.time = 0;
    timeField.value = '0:00';
    unpause(board, pauseButton, timeField, pauseOverlay);
}


function clickPause(board, pauseButton, timeField, pauseOverlay) {
    if (board.paused) {
        unpause(board, pauseButton, timeField, pauseOverlay);
    }
    else {
        pause(board, pauseButton, timeField, pauseOverlay);
    }
}


function clickReset(board, pauseButton, timeField, pauseOverlay) {
    board.resetInput();
    
    cancelAnimationFrame(board.timerFrameRequest);
    board.time = 0;
    timeField.value = '0:00';
    unpause(board, pauseButton, timeField, pauseOverlay);
}


function pause(board, pauseButton, timeField, pauseOverlay) {
    update(board, timeField);
    board.paused = true;
    cancelAnimationFrame(board.timerFrameRequest);
    
    pauseButton.textContent = '\u25b6\ufe0e';
    pauseButton.className = 'play-button';
    
    pauseOverlay.style.display = 'unset';
    board.classList.add('pause-blur');
}


function unpause(board, pauseButton, timeField, pauseOverlay) {
    board.paused = false;
    board.lastTimeUpdate = performance.now();
    updateLoop(board, timeField);
    
    pauseButton.textContent = '\u23f8\ufe0e';
    pauseButton.className = 'pause-button';
    
    pauseOverlay.style.display = '';
    board.classList.remove('pause-blur');
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
