export { createBoard };


function createBoard(puzzle) {
    let board = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    board.setAttribute('class', 'board');
    let boardSize = puzzle.size * 100 + 5;
    board.setAttribute('width', boardSize + 'px');
    board.setAttribute('height', boardSize + 'px');
    board.setAttribute('viewBox', `-2.5, -2.5, ${boardSize}, ${boardSize}`);
    board.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    board.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    board.puzzle = puzzle;
    board.isInCell = isInCell;
    board.cellPosition = cellPosition;
    board.redrawDigits = redrawDigits;
    board.drawSelection = drawSelection;
    
    // Add the board to the document temporarily to enable calculation of bounding boxes.
    document.body.appendChild(board);
    
    let stylePlaceholder = document.createElement('style');
    board.appendChild(stylePlaceholder);
    
    board.thermos = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.thermos);
    board.cages = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.cages);
    board.grid = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.grid);
    board.quads = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.quads);
    board.kropki = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.kropki);
    board.givens = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.givens);
    board.digits = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.digits);
    
    let gridSize = puzzle.size * 100;
    let cellLinesPath = '';
    for (let column = 1; column <= puzzle.size; column++) {
        let x = column * 100;
        cellLinesPath += `M${x} 0 L${x} ${gridSize}`;
    }
    for (let row = 1; row <= puzzle.size; row++) {
        let y = row * 100;
        cellLinesPath += `M0 ${y} L${gridSize} ${y}`;
    }
    let cellLines = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    cellLines.setAttribute('class', 'cell-line');
    cellLines.setAttribute('d', cellLinesPath);
    board.grid.appendChild(cellLines);
    
    let boxLines = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    boxLines.setAttribute('class', 'box-line');
    switch (puzzle.size) {
        case 9:
            boxLines.setAttribute('d', 'M0 300 L900 300 M0 600 L900 600 M300 0 L300 900 M600 0 L600 900');
            break;
    }
    board.grid.appendChild(boxLines);
    
    let borderLines = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    borderLines.setAttribute('class', 'border-line');
    borderLines.setAttribute('d', `M0 0 L${gridSize} 0 L${gridSize} ${gridSize} L0 ${gridSize} Z`);
    board.grid.appendChild(borderLines);
    
    for (let given of puzzle.givens) {
        drawGiven(board, ...given);
    }
    for (let cage of puzzle.cages) {
        drawCage(board, ...cage);
    }
    for (let thermo of puzzle.thermos) {
        drawThermo(board, thermo);
    }
    for (let kropki of puzzle.kropki) {
        drawKropki(board, ...kropki);
    }
    for (let quad of puzzle.quads) {
        drawQuad(board, ...quad);
    }
    
    for (let extra of puzzle.extras) {
        switch (extra.type) {
            case 'line':
                drawExtraLine(board, extra);
                break;
            case 'polygon':
                drawExtraPolygon(board, extra);
                break;
            case 'circle':
                drawExtraCircle(board, extra);
                break;
            case 'text':
                break;
        }
    }
    
    board.redrawDigits;
    
    document.body.removeChild(board);
    
    return board;
}


function isInCell(x, y, margin) {
    let bbox = this.getBoundingClientRect();
    x = x - bbox.x - 2;
    y = y - bbox.y - 2;
    if (x < 0 || y < 0 || x > this.puzzle.size * 100 || y > this.puzzle.size * 100) {
        // Outside board.
        return false;
    }
    if (x % 100 < margin || y % 100 < margin || x % 100 > 100 - margin || y % 100 > 100 - margin) {
        // Close to grid line.
        return false;
    }
    return true;
}


function cellPosition(x, y) {
    let bbox = this.getBoundingClientRect();
    x = x - bbox.x - 2;
    y = y - bbox.y - 2;
    let column = Math.floor(x / 100) + 1;
    let row = Math.floor(y / 100) + 1;
    return [column, row];
}


function redrawDigits() {
    this.digits.replaceChildren();
    for (let digit of this.puzzle.digits) {
        drawDigit(this, ...digit);
    }
    for (let centerMark of this.puzzle.centerMarks) {
        drawCenterMark(this, ...centerMark);
    }
    for (let cornerMark of this.puzzle.cornerMarks) {
        drawCornerMark(this, ...cornerMark);
    }
}


function drawSelection(cells) {
    let path = '';
    for (let cell of cells) {
        let x = cell[0] * 100 - 50;
        let y = cell[1] * 100 - 50;
        path += `M${x - 42.5} ${y - 42.5} L${x + 42.5} ${y - 42.5} L${x + 42.5} ${y + 42.5} L${x - 42.5} ${y + 42.5} Z `;
    }
    
    let selection = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    selection.setAttribute('class', 'selection');
    selection.setAttribute('d', path);
    this.insertBefore(selection, this.grid);
    
    return selection;
}


function drawGiven(board, digit, column, row) {
    let given = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    given.setAttribute('class', 'given');
    given.setAttribute('x', column * 100 - 50);
    given.setAttribute('y', row * 100 - 50);
    given.textContent = digit;
    board.givens.appendChild(given);
}


function drawCage(board, sum, cells, color, sumColor) {
    // Create cage cell segments.
    let lSegments = [];
    let tSegments = [];
    let rSegments = [];
    let bSegments = [];
    for (let cell of cells) {
        lSegments.push(cell);
        tSegments.push(cell);
        rSegments.push(cell);
        bSegments.push(cell);
    }
    
    // Remove segments between cells.
    let lKeepSegments = [];
    for (let lSegment of lSegments) {
        let keep = true;
        for (let rSegment of rSegments) {
            if (lSegment[0] == rSegment[0] + 1 && lSegment[1] == rSegment[1]) {
                keep = false;
                break;
            }
        }
        if (keep) {
            lKeepSegments.push(lSegment);
        }
    }
    let tKeepSegments = [];
    for (let tSegment of tSegments) {
        let keep = true;
        for (let bSegment of bSegments) {
            if (tSegment[1] == bSegment[1] + 1 && tSegment[0] == bSegment[0]) {
                keep = false;
                break;
            }
        }
        if (keep) {
            tKeepSegments.push(tSegment);
        }
    }
    let rKeepSegments = [];
    for (let rSegment of rSegments) {
        let keep = true;
        for (let lSegment of lSegments) {
            if (rSegment[0] == lSegment[0] - 1 && rSegment[1] == lSegment[1]) {
                keep = false;
                break;
            }
        }
        if (keep) {
            rKeepSegments.push(rSegment);
        }
    }
    let bKeepSegments = [];
    for (let bSegment of bSegments) {
        let keep = true;
        for (let tSegment of tSegments) {
            if (bSegment[1] == tSegment[1] - 1 && bSegment[0] == tSegment[0]) {
                keep = false;
                break;
            }
        }
        if (keep) {
            bKeepSegments.push(bSegment);
        }
    }
    lSegments = lKeepSegments;
    tSegments = tKeepSegments;
    rSegments = rKeepSegments;
    bSegments = bKeepSegments;
    
    // Connect segments.
    let segments = [];
    for (let lSegment of lSegments) {
        let joinUp = 0;
        let joinDown = 0;
        for (let lJoinSegment of lSegments) {
            if (lSegment[0] == lJoinSegment[0] && lSegment[1] == lJoinSegment[1] + 1) {
                joinUp = 10;
            }
            if (lSegment[0] == lJoinSegment[0] && lSegment[1] == lJoinSegment[1] - 1) {
                joinDown = 10;
            }
        }
        for (let bJoinSegment of bSegments) {
            if (lSegment[0] == bJoinSegment[0] + 1 && lSegment[1] == bJoinSegment[1] + 1) {
                joinUp = 20;
            }
        }
        for (let tJoinSegment of tSegments) {
            if (lSegment[0] == tJoinSegment[0] + 1 && lSegment[1] == tJoinSegment[1] - 1) {
                joinDown = 20;
            }
        }
        let x = lSegment[0] * 100 - 90;
        let y = lSegment[1] * 100 - 90;
        segments.push([x, y - joinUp, x, y + 80 + joinDown]);
    }
    for (let tSegment of tSegments) {
        let joinLeft = 0;
        let joinRight = 0;
        for (let tJoinSegment of tSegments) {
            if (tSegment[1] == tJoinSegment[1] && tSegment[0] == tJoinSegment[0] + 1) {
                joinLeft = 10;
            }
            if (tSegment[1] == tJoinSegment[1] && tSegment[0] == tJoinSegment[0] - 1) {
                joinRight = 10;
            }
        }
        for (let lJoinSegment of lSegments) {
            if (tSegment[0] == lJoinSegment[0] - 1 && tSegment[1] == lJoinSegment[1] + 1) {
                joinRight = 20;
            }
        }
        for (let rJoinSegment of rSegments) {
            if (tSegment[0] == rJoinSegment[0] + 1 && tSegment[1] == rJoinSegment[1] + 1) {
                joinLeft = 20;
            }
        }
        let x = tSegment[0] * 100 - 90;
        let y = tSegment[1] * 100 - 90;
        segments.push([x - joinLeft, y, x + 80 + joinRight, y]);
    }
    for (let rSegment of rSegments) {
        let joinUp = 0;
        let joinDown = 0;
        for (let rJoinSegment of rSegments) {
            if (rSegment[0] == rJoinSegment[0] && rSegment[1] == rJoinSegment[1] + 1) {
                joinUp = 10;
            }
            if (rSegment[0] == rJoinSegment[0] && rSegment[1] == rJoinSegment[1] - 1) {
                joinDown = 10;
            }
        }
        for (let bJoinSegment of bSegments) {
            if (rSegment[0] == bJoinSegment[0] - 1 && rSegment[1] == bJoinSegment[1] + 1) {
                joinUp = 20;
            }
        }
        for (let tJoinSegment of tSegments) {
            if (rSegment[0] == tJoinSegment[0] - 1 && rSegment[1] == tJoinSegment[1] - 1) {
                joinDown = 20;
            }
        }
        let x = rSegment[0] * 100 - 10;
        let y = rSegment[1] * 100 - 90;
        segments.push([x, y - joinUp, x, y + 80 + joinDown]);
    }
    for (let bSegment of bSegments) {
        let joinLeft = 0;
        let joinRight = 0;
        for (let bJoinSegment of bSegments) {
            if (bSegment[1] == bJoinSegment[1] && bSegment[0] == bJoinSegment[0] + 1) {
                joinLeft = 10;
            }
            if (bSegment[1] == bJoinSegment[1] && bSegment[0] == bJoinSegment[0] - 1) {
                joinRight = 10;
            }
        }
        for (let lJoinSegment of lSegments) {
            if (bSegment[0] == lJoinSegment[0] - 1 && bSegment[1] == lJoinSegment[1] - 1) {
                joinRight = 20;
            }
        }
        for (let rJoinSegment of rSegments) {
            if (bSegment[0] == rJoinSegment[0] + 1 && bSegment[1] == rJoinSegment[1] - 1) {
                joinLeft = 20;
            }
        }
        let x = bSegment[0] * 100 - 90;
        let y = bSegment[1] * 100 - 10;
        segments.push([x - joinLeft, y, x + 80 + joinRight, y]);
    }
    
    let path = '';
    for (let segment of segments) {
        path += ` M${segment[0]} ${segment[1]} L${segment[2]} ${segment[3]}`;
    }
    
    let cageLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    cageLine.setAttribute('class', 'cage-line');
    cageLine.setAttribute('d', path);
    if (color !== undefined) {
        cageLine.setAttribute('style', `stroke:${color}`);
    }
    board.cages.appendChild(cageLine);
    
    if (sum !== '') {
        let column = 10;
        let row = 10;
        for (let cell of cells) {
            if (cell[1] < row) {
                column = 10;
                row = cell[1];
            }
            if (cell[1] == row && cell[0] < column) {
                column = cell[0];
            }
        }
        
        let cageSum = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        cageSum.setAttribute('class', 'cage-sum');
        cageSum.setAttribute('x', column * 100 - 87.5);
        cageSum.setAttribute('y', row * 100 - 90);
        if (sumColor !== undefined) {
            cageSum.setAttribute('style', `fill:${sumColor}`);
        }
        cageSum.textContent = sum;
        board.cages.appendChild(cageSum);
    }
}


function drawThermo(board, lines) {
    for (let cells of lines) {
        let x = cells[0][0] * 100 - 50;
        let y = cells[0][1] * 100 - 50;
        let path = `M${x} ${y}`;
        for (let i = 1; i < cells.length; i++) {
            let x = cells[i][0] * 100 - 50;
            let y = cells[i][1] * 100 - 50;
            path += ` L${x} ${y}`;
        }
        
        let thermoLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        thermoLine.setAttribute('class', 'thermo-line');
        thermoLine.setAttribute('d', path);
        board.thermos.appendChild(thermoLine);
    }
    
    let thermoBulb = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    thermoBulb.setAttribute('class', 'thermo-bulb');
    thermoBulb.setAttribute('cx', lines[0][0][0] * 100 - 50);
    thermoBulb.setAttribute('cy', lines[0][0][1] * 100 - 50);
    thermoBulb.setAttribute('r', 40);
    board.thermos.appendChild(thermoBulb);
}


function drawKropki(board, value, type, column, row, horizontal) {
    let x = column * 100 - (horizontal ? 0 : 50);
    let y = row * 100 - (horizontal ? 50 : 0);
    
    let kropkiCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    kropkiCircle.setAttribute('class', `${type}-circle`);
    kropkiCircle.setAttribute('cx', x);
    kropkiCircle.setAttribute('cy', y);
    kropkiCircle.setAttribute('r', 15);
    board.kropki.appendChild(kropkiCircle);
    
    if (value !== '') {
        let kropkiValue = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        kropkiValue.setAttribute('class', `${type}-value`);
        kropkiValue.setAttribute('x', x);
        kropkiValue.setAttribute('y', y);
        kropkiValue.textContent = value;
        board.kropki.appendChild(kropkiValue);
    }
}


function drawQuad(board, digits, column, row) {
    let x = column * 100;
    let y = row * 100;
    
    let quadCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    quadCircle.setAttribute('class', 'quad-circle');
    quadCircle.setAttribute('cx', x);
    quadCircle.setAttribute('cy', y);
    quadCircle.setAttribute('r', 25);
    board.quads.appendChild(quadCircle);
    
    let lines = digits.split('\n');
    let dy = 10 - lines.length * 10;
    for (let line of lines) {
        let quadDigits = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        quadDigits.setAttribute('class', 'quad-digits');
        quadDigits.setAttribute('x', x);
        quadDigits.setAttribute('y', y + dy);
        quadDigits.textContent = line;
        board.quads.appendChild(quadDigits);
        dy += 20;
    }
}


function drawExtraLine(board, extra) {
    let x = extra.path[0][0] * 100 - 50;
    let y = extra.path[0][1] * 100 - 50;
    let path = `M${x} ${y}`;
    for (let i = 1; i < extra.path.length; i++) {
        let x = extra.path[i][0] * 100 - 50;
        let y = extra.path[i][1] * 100 - 50;
        path += ` L${x} ${y}`;
    }
    
    let width = extra.width === undefined ? 20 : extra.width;
    let join = extra.join === undefined ? 'round' : extra.join;
    let cap = extra.cap === undefined ? 'round' : extra.cap;
    let color = extra.color === undefined ? '#7f7f7f' : extra.color;
    
    let extraLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    extraLine.setAttribute('d', path);
    extraLine.setAttribute('stroke', color);
    extraLine.setAttribute('fill', 'none');
    extraLine.setAttribute('stroke-width', width);
    extraLine.setAttribute('stroke-linejoin', join);
    extraLine.setAttribute('stroke-linecap', cap);
    
    let before = extra.before === undefined ? 'givens' : extra.before;
    if (before == '') {
        board.appendChild(extraLine);
    }
    else {
        board.insertBefore(extraLine, board[before]);
    }
}


function drawExtraPolygon(board, extra) {
    let x = extra.path[0][0] * 100 - 50;
    let y = extra.path[0][1] * 100 - 50;
    let path = `M${x} ${y}`;
    for (let i = 1; i < extra.path.length; i++) {
        let x = extra.path[i][0] * 100 - 50;
        let y = extra.path[i][1] * 100 - 50;
        path += ` L${x} ${y}`;
    }
    path += ' Z';
    
    let width = extra.width === undefined ? 1.5 : extra.width;
    let color = extra.color === undefined ? '#000000' : extra.color;
    let fill = extra.fill === undefined ? 'none' : extra.fill;
    
    let extraPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    extraPolygon.setAttribute('d', path);
    extraPolygon.setAttribute('stroke', color);
    extraPolygon.setAttribute('fill', fill);
    extraPolygon.setAttribute('stroke-width', width);
    
    let before = extra.before === undefined ? 'givens' : extra.before;
    if (before == '') {
        board.appendChild(extraPolygon);
    }
    else {
        board.insertBefore(extraPolygon, board[before]);
    }
}


function drawExtraCircle(board, extra) {
    let x = extra.center[0] * 100;
    let y = extra.center[1] * 100;
    let rx = extra.radius === undefined ? 40 : extra.radius[0];
    let ry = extra.radius === undefined ? 40 : extra.radius[1];
    
    let width = extra.width === undefined ? 1.5 : extra.width;
    let color = extra.color === undefined ? '#000000' : extra.color;
    let fill = extra.fill === undefined ? 'none' : extra.fill;
    
    let extraCircle = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    extraCircle.setAttribute('cx', x);
    extraCircle.setAttribute('cy', y);
    extraCircle.setAttribute('rx', rx);
    extraCircle.setAttribute('ry', ry);
    if (extra.angle !== undefined && extra.angle != 0) {
        extraCircle.setAttribute('transform', `rotate(${extra.angle}, ${x}, ${y})`);
    }
    extraCircle.setAttribute('stroke', color);
    extraCircle.setAttribute('fill', fill);
    extraCircle.setAttribute('stroke-width', width);
    
    let before = extra.before === undefined ? 'givens' : extra.before;
    if (before == '') {
        board.appendChild(extraCircle);
    }
    else {
        board.insertBefore(extraCircle, board[before]);
    }
}


function drawDigit(board, digit, column, row) {
    let digitText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    digitText.setAttribute('class', 'digit');
    digitText.setAttribute('x', column * 100 - 50);
    digitText.setAttribute('y', row * 100 - 50);
    digitText.textContent = digit;
    board.digits.appendChild(digitText);
}


function drawCenterMark(board, digits, column, row) {
    let digitText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    digitText.setAttribute('class', 'pencilmark');
    digitText.setAttribute('x', column * 100 - 50);
    digitText.setAttribute('y', row * 100 - 50);
    digitText.textContent = digits.join('');
    board.digits.appendChild(digitText);
    
    let bbox = digitText.getBoundingClientRect();
    if (bbox.width > 90) {
        digitText.setAttribute('style', `font-size: ${90 * 30 / bbox.width}px`);
    }
}


function drawCornerMark(board, digits, column, row) {
    let digitsPerLine = Math.max(2, Math.ceil(digits.length / 2));
    let digitSpacing = [70 / (digitsPerLine - 1), 70 / (Math.max(2, Math.ceil(digits.length / 2 - 0.5)) - 1)];
    
    for (let [i, digit] of digits.entries()) {
        let line = Math.floor(i * 2 / Math.max(3, digits.length));
        let iInLine = i % Math.max(2, Math.ceil(digits.length / 2));
        let x = column * 100 - 85 + iInLine * digitSpacing[line];
        let y = row * 100 - 80 + line * 60;
        
        let digitText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        digitText.setAttribute('class', 'pencilmark');
        digitText.setAttribute('x', x);
        digitText.setAttribute('y', y);
        digitText.textContent = digit;
        board.digits.appendChild(digitText);
    }
}
