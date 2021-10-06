export { createBoard };


function createBoard(puzzle) {
    let board = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    board.setAttribute('class', 'board');
    board.padding = [2, 2, 2, 2];
    board.size = [
        puzzle.size * 100 + 1 + board.padding[0] + board.padding[2],
        puzzle.size * 100 + 1 + board.padding[1] + board.padding[3]
    ];
    board.setAttribute('width', board.size[0]);
    board.setAttribute('height', board.size[1]);
    let viewBox = [
        -0.5 - board.padding[0],
        -0.5 - board.padding[1],
        board.size[0],
        board.size[1]
    ];
    board.setAttribute('viewBox', viewBox.join(', '));
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
    
    board.defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    board.appendChild(board.defs);
    
    let arrowMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    arrowMarker.setAttribute('id', 'arrow-cap');
    arrowMarker.setAttribute('markerWidth', 100);
    arrowMarker.setAttribute('markerHeight', 100);
    arrowMarker.setAttribute('markerUnits', 'userSpaceOnUse');
    arrowMarker.setAttribute('viewBox', '-50 -50 100 100');
    arrowMarker.setAttribute('orient', 'auto-start-reverse');
    let arrowMarkerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrowMarkerPath.setAttribute('class', 'arrow-cap');
    arrowMarkerPath.setAttribute('d', 'M-20 -20 L0 0 L-20 20');
    arrowMarker.appendChild(arrowMarkerPath);
    board.defs.appendChild(arrowMarker);
    
    let littleKillerMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    littleKillerMarker.setAttribute('id', 'little-killer-cap');
    littleKillerMarker.setAttribute('markerWidth', 100);
    littleKillerMarker.setAttribute('markerHeight', 100);
    littleKillerMarker.setAttribute('markerUnits', 'userSpaceOnUse');
    littleKillerMarker.setAttribute('viewBox', '-50 -50 100 100');
    littleKillerMarker.setAttribute('orient', 'auto-start-reverse');
    let littleKillerMarkerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    littleKillerMarkerPath.setAttribute('class', 'little-killer-arrow');
    littleKillerMarkerPath.setAttribute('d', 'M-10 -10 L0 0 L-10 10');
    littleKillerMarker.appendChild(littleKillerMarkerPath);
    board.defs.appendChild(littleKillerMarker);
    
    board.colors = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.colors);
    board.thermos = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.thermos);
    board.arrows = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.arrows);
    board.parity = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.parity);
    board.cages = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.cages);
    board.grid = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.grid);
    board.quads = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.quads);
    board.kropki = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.kropki);
    board.xv = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.xv);
    board.littleKillers = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.littleKillers);
    board.givens = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.givens);
    board.digits = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    board.appendChild(board.digits);
    
    let gridSize = puzzle.size * 100;
    if (puzzle.diagonals[0]) {
        let diagonalLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        diagonalLine.setAttribute('class', 'diagonal-line');
        diagonalLine.setAttribute('d', `M0 ${gridSize} L${gridSize} 0`);
        board.grid.appendChild(diagonalLine);
    }
    if (puzzle.diagonals[1]) {
        let diagonalLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        diagonalLine.setAttribute('class', 'diagonal-line');
        diagonalLine.setAttribute('d', `M0 0 L${gridSize} ${gridSize}`);
        board.grid.appendChild(diagonalLine);
    }
    
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
    
    for (let thermo of puzzle.thermos) {
        drawThermo(board, thermo);
    }
    for (let arrow of puzzle.arrows) {
        drawArrow(board, ...arrow);
    }
    for (let parity of puzzle.parity) {
        drawParity(board, ...parity);
    }
    for (let cage of puzzle.cages) {
        drawCage(board, ...cage);
    }
    for (let quad of puzzle.quads) {
        drawQuad(board, ...quad);
    }
    for (let kropki of puzzle.kropki) {
        drawKropki(board, ...kropki);
    }
    for (let xv of puzzle.xv) {
        drawXV(board, ...xv);
    }
    for (let littleKiller of puzzle.littleKillers) {
        drawLittleKiller(board, ...littleKiller);
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
                drawExtraText(board, extra);
                break;
        }
    }
    
    for (let given of puzzle.givens) {
        drawGiven(board, ...given);
    }
    board.redrawDigits();
    
    document.body.removeChild(board);
    
    return board;
}


function isInCell(x, y, margin) {
    let screenCTM = this.getScreenCTM();
    x = (x - screenCTM.e) / screenCTM.a + 0.5;
    y = (y - screenCTM.f) / screenCTM.d + 0.5;
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
    let screenCTM = this.getScreenCTM();
    x = (x - screenCTM.e) / screenCTM.a + 0.5;
    y = (y - screenCTM.f) / screenCTM.d + 0.5;
    let column = Math.floor(x / 100) + 1;
    let row = Math.floor(y / 100) + 1;
    return [column, row];
}


function redrawDigits() {
    this.colors.replaceChildren();
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
    for (let color of this.puzzle.colors) {
        drawColor(this, ...color);
    }
}


function expandPadding(board, left, top, right, bottom) {
    if (left <= board.padding[0] && top <= board.padding[1] && right <= board.padding[2] && bottom <= board.padding[3]) {
        // No change.
        return;
    }
    
    board.padding = [
        Math.max(board.padding[0], left),
        Math.max(board.padding[1], top),
        Math.max(board.padding[2], right),
        Math.max(board.padding[3], bottom)
    ];
    board.size = [
        board.puzzle.size * 100 + 1 + board.padding[0] + board.padding[2],
        board.puzzle.size * 100 + 1 + board.padding[1] + board.padding[3]
    ];
    board.setAttribute('width', board.size[0]);
    board.setAttribute('height', board.size[1]);
    let viewBox = [
        -0.5 - board.padding[0],
        -0.5 - board.padding[1],
        board.size[0],
        board.size[1]
    ];
    board.setAttribute('viewBox', viewBox.join(', '));
}


function createOutline(board, cells, inset) {
    let gridSize = board.puzzle.size + 3;
    function edgeIndex(column, row, direction) {
        return row * gridSize + column + direction * gridSize ** 2;
    }
    
    let edges = {};
    for (let cell of cells) {
        // Left edge.
        let left = edgeIndex(cell[0] - 1, cell[1], 2);
        if (edges[left] === undefined) {
            edges[edgeIndex(...cell, 0)] = {
                back: [cell[0] * 100 - 100 + inset, cell[1] * 100 - inset],
                farBack: [cell[0] * 100 - 100 + inset, cell[1] * 100 + inset],
                forwardJoin: edgeIndex(cell[0], cell[1] - 1, 0),
                convexJoin: edgeIndex(cell[0], cell[1], 1),
                concaveJoin: edgeIndex(cell[0] - 1, cell[1] - 1, 3),
                visited: false
            };
        }
        else {
            delete edges[left];
        }
        // Top Edge.
        let up = edgeIndex(cell[0], cell[1] - 1, 3);
        if (edges[up] === undefined) {
            edges[edgeIndex(...cell, 1)] = {
                back: [cell[0] * 100 - 100 + inset, cell[1] * 100 - 100 + inset],
                farBack: [cell[0] * 100 - 100 - inset, cell[1] * 100 - 100 + inset],
                forwardJoin: edgeIndex(cell[0] + 1, cell[1], 1),
                convexJoin: edgeIndex(cell[0], cell[1], 2),
                concaveJoin: edgeIndex(cell[0] + 1, cell[1] - 1, 0),
                visited: false
            };
        }
        else {
            delete edges[up];
        }
        // Right edge.
        let right = edgeIndex(cell[0] + 1, cell[1], 0);
        if (edges[right] === undefined) {
            edges[edgeIndex(...cell, 2)] = {
                back: [cell[0] * 100 - inset, cell[1] * 100 - 100 + inset],
                farBack: [cell[0] * 100 - inset, cell[1] * 100 - 100 - inset],
                forwardJoin: edgeIndex(cell[0], cell[1] + 1, 2),
                convexJoin: edgeIndex(cell[0], cell[1], 3),
                concaveJoin: edgeIndex(cell[0] + 1, cell[1] + 1, 1),
                visited: false
            };
        }
        else {
            delete edges[right];
        }
        // Bottom edge.
        let down = edgeIndex(cell[0], cell[1] + 1, 1);
        if (edges[down] === undefined) {
            edges[edgeIndex(...cell, 3)] = 3;
            edges[edgeIndex(...cell, 3)] = {
                back: [cell[0] * 100 - inset, cell[1] * 100 - inset],
                farBack: [cell[0] * 100 + inset, cell[1] * 100 - inset],
                forwardJoin: edgeIndex(cell[0] - 1, cell[1], 3),
                convexJoin: edgeIndex(cell[0], cell[1], 0),
                concaveJoin: edgeIndex(cell[0] - 1, cell[1] + 1, 2),
                visited: false
            };
        }
        else {
            delete edges[down];
        }
    }
    
    let paths = [];
    for (let [first, edge] of Object.entries(edges)) {
        if (edge.visited) {
            continue;
        }
        let path = '';
        let current = first;
        let target = 'back';
        do {
            let edge = edges[current];
            edge.visited = true;
            if (current != first) {
                path += ` L${edge[target][0]} ${edge[target][1]}`;
            }
            let forwardEdge = edges[edge.forwardJoin];
            if (forwardEdge !== undefined) {
                current = edge.forwardJoin;
                target = 'back';
                continue;
            }
            let convexEdge = edges[edge.convexJoin];
            if (convexEdge !== undefined) {
                current = edge.convexJoin;
                target = 'back';
                continue;
            }
            let concaveEdge = edges[edge.concaveJoin];
            if (concaveEdge !== undefined) {
                current = edge.concaveJoin;
                target = 'farBack';
            }
        } while (current != first);
        paths.push(`M${edge[target][0]} ${edge[target][1]}${path} Z`);
    }
    
    return paths.join(' ');
}


function drawSelection(cells) {
    let selection = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.insertBefore(selection, this.grid);
    
    let fillPath = createOutline(this, cells, 0);
    let selectionFill = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    selectionFill.setAttribute('class', 'selection');
    selectionFill.setAttribute('d', fillPath);
    selection.appendChild(selectionFill);
    
    let linePath = createOutline(this, cells, 6.25);
    let selectionLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    selectionLine.setAttribute('class', 'selection-line');
    selectionLine.setAttribute('d', linePath);
    selection.appendChild(selectionLine);
    
    return selection;
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


let arrowMaskId = 0;

function drawArrow(board, cells, lines) {
    /* The great arrow mask hack of 2021:
     * Firefox appears to have a bug in the way it draws lines with masks.
     * It seems like it calculates the bounding box of the line's path without considering line width.
     * This leads to the line being clipped wrongly, and either disappearing completely or having its ends trimmed,
     * depending on the angle the line is drawn at and how close it is to its bounding box at any given point.
     * To work around this, I've constructed a "hack path" that I add to each line, which is made up of 2 segments
     * that are drawn outside of the viewport.
     * The result is that the bounding box for the line gets expanded to include the segements in the hack path,
     * thus fixing the clipping issue resulting from a more compact bounding box.
     * --------------------------------------------------------------------------------
     * Note about future improvements:
     * Because this method of drawing arrows uses 2 masks for each arrow, it's slow and causes noticable input lag.
     * An improvement would be to use an outline algorithm to generate paths for the arrow bulbs.
     */
    let bboxL = -board.padding[0];
    let bboxT = -board.padding[1];
    let bboxR = board.size[0] + board.padding[2];
    let bboxB = board.size[1] + board.padding[3];
    let bboxPath = `M${bboxL} ${bboxT} L${bboxR} ${bboxT} L${bboxR} ${bboxB} L${bboxL} ${bboxB} Z`;
    let hackPath = `M${bboxL - 100} ${bboxT - 100} L${bboxR + 100} ${bboxT - 100} L${bboxR + 100} ${bboxB + 100}`;
    
    if (cells.length == 1) {
        // One bulb cell: Arrow line mask is a circle.
        let arrowLineMask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        arrowLineMask.setAttribute('id', 'arrow-line-mask-' + arrowMaskId);
        let arrowLineMaskWhite = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowLineMaskWhite.setAttribute('fill', '#ffffff');
        arrowLineMaskWhite.setAttribute('d', bboxPath);
        arrowLineMask.appendChild(arrowLineMaskWhite);
        let arrowLineMaskBlack = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        arrowLineMaskBlack.setAttribute('cx', cells[0][0] * 100 - 50);
        arrowLineMaskBlack.setAttribute('cy', cells[0][1] * 100 - 50);
        arrowLineMaskBlack.setAttribute('r', 36.5);
        arrowLineMask.appendChild(arrowLineMaskBlack);
        board.defs.appendChild(arrowLineMask);
    }
    
    if (cells.length > 1) {
        // Multiple bulb cells: Arrow line mask is a line.
        let x = cells[0][0] * 100 - 50;
        let y = cells[0][1] * 100 - 50;
        let path = `M${x} ${y}`;
        for (let i = 1; i < cells.length; i++) {
            let x = cells[i][0] * 100 - 50;
            let y = cells[i][1] * 100 - 50;
            path += ` L${x} ${y}`;
        }
        let arrowLineMask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        arrowLineMask.setAttribute('id', 'arrow-line-mask-' + arrowMaskId);
        let arrowLineMaskWhite = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowLineMaskWhite.setAttribute('fill', '#ffffff');
        arrowLineMaskWhite.setAttribute('d', bboxPath);
        arrowLineMask.appendChild(arrowLineMaskWhite);
        let arrowLineMaskBlack = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowLineMaskBlack.setAttribute('class', 'arrow-mask-black');
        arrowLineMaskBlack.setAttribute('d', path);
        arrowLineMask.appendChild(arrowLineMaskBlack);
        board.defs.appendChild(arrowLineMask);
    }
    
    for (let cells of lines) {
        let x = cells[0][0] * 100 - 50;
        let y = cells[0][1] * 100 - 50;
        let path = `${hackPath} M${x} ${y}`;
        for (let i = 1; i < cells.length; i++) {
            let x = cells[i][0] * 100 - 50;
            let y = cells[i][1] * 100 - 50;
            path += ` L${x} ${y}`;
        }
        
        let arrowLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowLine.setAttribute('class', 'arrow-line');
        arrowLine.setAttribute('d', path);
        arrowLine.setAttribute('marker-end', 'url(#arrow-cap)');
        if (cells.length > 0) {
            arrowLine.setAttribute('mask', `url(#arrow-line-mask-${arrowMaskId})`);
        }
        board.arrows.appendChild(arrowLine);
    }
    
    if (cells.length == 1) {
        // One bulb cell: Bulb is a circle with an outline.
        let arrowBulb = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        arrowBulb.setAttribute('class', 'arrow-bulb');
        arrowBulb.setAttribute('cx', cells[0][0] * 100 - 50);
        arrowBulb.setAttribute('cy', cells[0][1] * 100 - 50);
        arrowBulb.setAttribute('r', 38.25);
        board.arrows.appendChild(arrowBulb);
    }
    
    if (cells.length > 1) {
        // Multiple bulb cells: Bulb is a filled box with a line outline mask.
        let x = cells[0][0] * 100 - 50;
        let y = cells[0][1] * 100 - 50;
        let path = `M${x} ${y}`;
        for (let i = 1; i < cells.length; i++) {
            let x = cells[i][0] * 100 - 50;
            let y = cells[i][1] * 100 - 50;
            path += ` L${x} ${y}`;
        }
        
        let arrowBulbMask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        arrowBulbMask.setAttribute('id', 'arrow-bulb-mask-' + arrowMaskId);
        let arrowBulbMaskWhite = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowBulbMaskWhite.setAttribute('class', 'arrow-mask-white');
        arrowBulbMaskWhite.setAttribute('d', path);
        arrowBulbMask.appendChild(arrowBulbMaskWhite);
        let arrowBulbMaskBlack = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowBulbMaskBlack.setAttribute('class', 'arrow-mask-black');
        arrowBulbMaskBlack.setAttribute('d', path);
        arrowBulbMask.appendChild(arrowBulbMaskBlack);
        board.defs.appendChild(arrowBulbMask);
        
        let arrowBulbFill = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowBulbFill.setAttribute('class', 'arrow-bulbline-fill');
        arrowBulbFill.setAttribute('d', path);
        board.arrows.appendChild(arrowBulbFill);
        
        let arrowBulbStroke = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowBulbStroke.setAttribute('class', 'arrow-bulbline-stroke');
        arrowBulbStroke.setAttribute('d', bboxPath);
        arrowBulbStroke.setAttribute('mask', `url(#arrow-bulb-mask-${arrowMaskId})`);
        board.arrows.appendChild(arrowBulbStroke);
    }
    
    arrowMaskId++;
}


function drawParity(board, even, column, row) {
    let x = column * 100 - 50;
    let y = row * 100 - 50;
    
    if (even) {
        let evenSquare = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        evenSquare.setAttribute('class', 'even-square');
        evenSquare.setAttribute('x', x - 37.5);
        evenSquare.setAttribute('y', y - 37.5);
        evenSquare.setAttribute('width', 75);
        evenSquare.setAttribute('height', 75);
        board.parity.appendChild(evenSquare);
    }
    else {
        let oddCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        oddCircle.setAttribute('class', 'odd-circle');
        oddCircle.setAttribute('cx', x);
        oddCircle.setAttribute('cy', y);
        oddCircle.setAttribute('r', 37.5);
        board.parity.appendChild(oddCircle);
    }
}


function drawCage(board, sum, cells, color, sumColor) {
    let path = createOutline(board, cells, 10);
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
        cageSum.setAttribute('y', row * 100 - 89);
        if (sumColor !== undefined) {
            cageSum.setAttribute('style', `fill:${sumColor}`);
        }
        cageSum.textContent = sum;
        board.cages.appendChild(cageSum);
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


function drawXV(board, value, column, row, horizontal) {
    let x = column * 100 - (horizontal ? 0 : 50);
    let y = row * 100 - (horizontal ? 50 : 0);
    
    let xvCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    xvCircle.setAttribute('class', 'xv-circle');
    xvCircle.setAttribute('cx', x);
    xvCircle.setAttribute('cy', y);
    xvCircle.setAttribute('r', 15);
    board.xv.appendChild(xvCircle);
    
    let xvValue = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xvValue.setAttribute('class', 'xv-value');
    xvValue.setAttribute('x', x);
    xvValue.setAttribute('y', y);
    xvValue.textContent = value;
    board.xv.appendChild(xvValue);
}


function drawLittleKiller(board, sum, column, row, right, down) {
    let expandLeft = column < 1 ? 80 : 0;
    let expandUp = row < 1 ? 80 : 0;
    let expandRight = column > board.puzzle.size ? 80 : 0;
    let expandDown = row > board.puzzle.size ? 80 : 0;
    expandPadding(board, expandLeft, expandUp, expandRight, expandDown);
    
    let x = column * 100 - 50;
    let y = row * 100 - 50;
    let dx = right ? 1 : -1;
    let dy = down ? 1 : -1;
    
    let littleKillerArrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    littleKillerArrow.setAttribute('class', 'little-killer-arrow');
    littleKillerArrow.setAttribute('d', `M${x + dx * 30} ${y + dy * 30} L${x + dx * 45} ${y + dy * 45}`);
    littleKillerArrow.setAttribute('marker-end', 'url(#little-killer-cap)');
    board.littleKillers.appendChild(littleKillerArrow);
    
    let littleKillerSum = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    littleKillerSum.setAttribute('class', 'little-killer-sum');
    littleKillerSum.setAttribute('x', x);
    littleKillerSum.setAttribute('y', y);
    littleKillerSum.textContent = sum;
    board.littleKillers.appendChild(littleKillerSum);
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
    let color = extra.color === undefined ? '#404040' : extra.color;
    
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
    let color = extra.color === undefined ? '#202020' : extra.color;
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
    let color = extra.color === undefined ? '#202020' : extra.color;
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


function drawExtraText(board, extra) {
    let x = extra.position[0] * 100;
    let y = extra.position[1] * 100;
    let halign = 'middle';
    let valign = 'central';
    let size = extra.size === undefined ? 20 : extra.size;
    let color = extra.color === undefined ? '#303030' : extra.color;
    
    switch (extra.halign) {
        case 'left':
            halign = '';
            break;
        case 'right':
            halign = 'end';
            break;
    }
    switch (extra.valign) {
        case 'bottom':
            valign = '';
            break;
        case 'top':
            valign = 'hanging';
            break;
    }
    
    let extraText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    extraText.setAttribute('x', x);
    extraText.setAttribute('y', y);
    extraText.setAttribute('font-size', `${size}px`);
    if (halign) {
        extraText.setAttribute('text-anchor', halign);
    }
    if (valign) {
        extraText.setAttribute('dominant-baseline', valign);
    }
    if (extra.angle !== undefined && extra.angle != 0) {
        extraText.setAttribute('transform', `rotate(${extra.angle}, ${x}, ${y})`);
    }
    extraText.setAttribute('fill', color);
    extraText.textContent = extra.text;
    
    let before = extra.before === undefined ? 'givens' : extra.before;
    if (before == '') {
        board.appendChild(extraText);
    }
    else {
        board.insertBefore(extraText, board[before]);
    }
}


function drawGiven(board, digit, column, row) {
    let given = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    given.setAttribute('class', 'given');
    given.setAttribute('x', column * 100 - 50);
    given.setAttribute('y', row * 100 - 50);
    given.textContent = digit;
    board.givens.appendChild(given);
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


function drawColor(board, colors, column, row) {
    for (let [i, color] of colors.entries()) {
        let x = column * 100 - 100;
        let y = row * 100 - 100;
        
        let colorFill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        colorFill.setAttribute('x', x);
        colorFill.setAttribute('y', y);
        colorFill.setAttribute('width', 100);
        colorFill.setAttribute('height', 100);
        colorFill.setAttribute('fill', color);
        board.colors.appendChild(colorFill);
    }
}
