export { startTimer };


function startTimer(board, panel, pauseOverlay) {
    board.pauseOverlay = pauseOverlay;
    
    board.pauseButton = panel.querySelector('.pause-button');
    board.timeField = panel.querySelector('.timer-time');
    board.resetButton = panel.querySelector('.reset-button');
    
    panel.addEventListener('pointerdown', event => event.stopPropagation());
    board.pauseButton.addEventListener('click', () => clickPause(board));
    board.resetButton.addEventListener('click', () => clickReset(board));
    pauseOverlay.addEventListener('click', () => clickPause(board));
    
    board.time = 0;
    board.timeField.value = '0:00';
    unpause(board);
    
    board.stopTimer = stopTimer;
}


function stopTimer() {
    if (this.paused) {
        this.pauseOverlay.style.display = '';
        this.classList.remove('pause-blur');
        return;
    }
    
    update(this);
    this.paused = true;
    this.stopped = true;
    cancelAnimationFrame(this.timerFrameRequest);
    
    this.pauseButton.textContent = '\u25b6\ufe0e';
    this.pauseButton.className = 'play-button';
}


function clickPause(board) {
    if (board.paused) {
        unpause(board);
    }
    else {
        pause(board);
    }
}


function clickReset(board) {
    board.resetInput();
    
    cancelAnimationFrame(board.timerFrameRequest);
    board.time = 0;
    board.timeField.value = '0:00';
    unpause(board);
}


function pause(board) {
    update(board);
    board.paused = true;
    cancelAnimationFrame(board.timerFrameRequest);
    
    board.pauseButton.textContent = '\u25b6\ufe0e';
    board.pauseButton.className = 'play-button';
    
    board.pauseOverlay.style.display = 'unset';
    board.classList.add('pause-blur');
}


function unpause(board) {
    board.stopped = false;
    board.paused = false;
    board.lastTimeUpdate = performance.now();
    updateLoop(board);
    
    board.pauseButton.textContent = '\u23f8\ufe0e';
    board.pauseButton.className = 'pause-button';
    
    board.pauseOverlay.style.display = '';
    board.classList.remove('pause-blur');
}


function updateLoop(board) {
    update(board);
    board.timerFrameRequest = requestAnimationFrame(() => updateLoop(board));
}


function update(board) {
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
    board.timeField.value = timeString;
}
