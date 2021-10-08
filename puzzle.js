export { loadFromFPuzzles, addBackground, addSpikyLine };


function loadFromFPuzzles(fpuzzles) {
    let compressedData = fpuzzles.replaceAll(' ', '+');
    let data = JSON.parse(LZString.decompressFromBase64(compressedData));
    console.log(data);
    
    let puzzle = {
        size: data.size,
        title: '',
        author: '',
        regions: [],
        extraRegions: [],
        clones: [],
        fortresses: [],
        thermos: [],
        palindromes: [],
        parity: [],
        betweenLines: [],
        arrows: [],
        cages: [],
        diagonals: [false, false],
        quads: [],
        kropki: [],
        xv: [],
        littleKillers: [],
        sandwiches: [],
        extras: [],
        givens: [],
        digits: [],
        centerMarks: [],
        cornerMarks: [],
        colors: []
    };
    
    puzzle.cellIndex = cellIndex;
    puzzle.cellPosition = cellPosition;
    
    puzzle.title = data.title ? data.title : 'Sudoku';
    puzzle.author = data.author ? data.author : '';
    
    function rxcxToCell(rxcx) {
        let match = rxcx.match(/R([0-9]+)C([0-9]+)/);
        return [match[2] | 0, match[1] | 0];
    }
    
    let cellRegions = {};
    
    for (let row = 1; row <= data.size; row++) {
        for (let column = 1; column <= data.size; column++) {
            let cell = data.grid[row - 1][column - 1];
            if (cell.given) {
                puzzle.givens.push([cell.value, column, row]);
            }
            if (cell.c !== undefined) {
                puzzle.extras.push({
                    type: 'polygon',
                    before: 'colors',
                    path: [[column - 0.5, row - 0.5], [column + 0.5, row - 0.5], [column + 0.5, row + 0.5], [column - 0.5, row + 0.5]],
                    color: 'none',
                    fill: cell.c
                });
            }
            if (cell.region !== undefined) {
                cellRegions[puzzle.cellIndex(column, row)] = cell.region;
            }
        }
    }
    
    if (Object.keys(cellRegions).length > 0) {
        puzzle.regions = (new Array(data.size)).fill(0).map(() => []);
        for (let row = 1; row <= data.size; row++) {
            for (let column = 1; column <= data.size; column++) {
                let region = cellRegions[puzzle.cellIndex(column, row)];
                if (region !== undefined) {
                    puzzle.regions[region].push([column, row]);
                    continue;
                }
                let column0 = column - 1;
                let row0 = row - 1;
                switch (data.size) {
                    case 4:
                        region = Math.floor(row0 / 2) * 2 + Math.floor(column0 % 4 / 2);
                        break;
                    case 6:
                        region = Math.floor(row0 / 2) * 2 + Math.floor(column0 % 6 / 3);
                        break;
                    case 8:
                        region = Math.floor(row0 / 2) * 2 + Math.floor(column0 % 8 / 4);
                        break;
                    case 9:
                        region = Math.floor(row0 / 3) * 3 + Math.floor(column0 % 9 / 3);
                        break;
                    case 10:
                        region = Math.floor(row0 / 2) * 2 + Math.floor(column0 % 10 / 5);
                        break;
                    case 12:
                        region = Math.floor(row0 / 3) * 3 + Math.floor(column0 % 12 / 4);
                        break;
                    case 14:
                        region = Math.floor(row0 / 2) * 2 + Math.floor(column0 % 14 / 7);
                        break;
                    case 15:
                        region = Math.floor(row0 / 3) * 3 + Math.floor(column0 % 15 / 5);
                        break;
                    case 16:
                        region = Math.floor(row0 / 4) * 4 + Math.floor(column0 % 16 / 4);
                        break;
                    default:
                        region = row0;
                        break;
                }
                puzzle.regions[region].push([column, row]);
            }
        }
    }
    
    data.extraregion = data.extraregion !== undefined ? data.extraregion : [];
    for (let extraregion of data.extraregion) {
        let cells = [];
        for (let rxcx of extraregion.cells) {
            cells.push(rxcxToCell(rxcx));
        }
        puzzle.extraRegions.push(cells);
    }
    
    data.clone = data.clone !== undefined ? data.clone : [];
    for (let clone of data.clone) {
        let cells = [];
        for (let rxcx of clone.cells) {
            cells.push(rxcxToCell(rxcx));
        }
        let cloneCells = [];
        for (let rxcx of clone.cloneCells) {
            cells.push(rxcxToCell(rxcx));
        }
        puzzle.clones.push([cells, cloneCells]);
    }
    
    data.minimum = data.minimum !== undefined ? data.minimum : [];
    for (let minimum of data.minimum) {
        let cell = rxcxToCell(minimum.cell);
        puzzle.fortresses.push([true, cell[0], cell[1]]);
    }
    
    data.maximum = data.maximum !== undefined ? data.maximum : [];
    for (let maximum of data.maximum) {
        let cell = rxcxToCell(maximum.cell);
        puzzle.fortresses.push([false, cell[0], cell[1]]);
    }
    
    data.thermometer = data.thermometer !== undefined ? data.thermometer : [];
    for (let thermo of data.thermometer) {
        let lines = [];
        for (let part of thermo.lines) {
            let line = [];
            for (let rxcx of part) {
                line.push(rxcxToCell(rxcx));
            }
            lines.push(line);
        }
        puzzle.thermos.push(lines);
    }
    
    data.palindrome = data.palindrome !== undefined ? data.palindrome : [];
    for (let palindrome of data.palindrome) {
        let lines = [];
        for (let part of palindrome.lines) {
            let line = [];
            for (let rxcx of part) {
                line.push(rxcxToCell(rxcx));
            }
            puzzle.palindromes.push(line);
        }
    }
    
    data.betweenline = data.betweenline !== undefined ? data.betweenline : [];
    for (let betweenline of data.betweenline) {
        let lines = [];
        for (let part of betweenline.lines) {
            let line = [];
            for (let rxcx of part) {
                line.push(rxcxToCell(rxcx));
            }
            puzzle.betweenLines.push(line);
        }
    }
    
    data.arrow = data.arrow !== undefined ? data.arrow : [];
    for (let arrow of data.arrow) {
        let cells = [];
        for (let rxcx of arrow.cells) {
            cells.push(rxcxToCell(rxcx));
        }
        let lines = [];
        for (let part of arrow.lines) {
            let line = [];
            for (let rxcx of part) {
                line.push(rxcxToCell(rxcx));
            }
            lines.push(line);
        }
        puzzle.arrows.push([cells, lines]);
    }
    
    data.even = data.even !== undefined ? data.even : [];
    for (let even of data.even) {
        let cell = rxcxToCell(even.cell);
        puzzle.parity.push([true, cell[0], cell[1]]);
    }
    
    data.odd = data.odd !== undefined ? data.odd : [];
    for (let odd of data.odd) {
        let cell = rxcxToCell(odd.cell);
        puzzle.parity.push([false, cell[0], cell[1]]);
    }
    
    data.killercage = data.killercage !== undefined ? data.killercage : [];
    for (let cage of data.killercage) {
        let cells = [];
        for (let rxcx of cage.cells) {
            cells.push(rxcxToCell(rxcx));
        }
        let sum = cage.value !== undefined ? cage.value : '';
        puzzle.cages.push([sum, cells]);
    }
    
    data.cage = data.cage !== undefined ? data.cage : [];
    for (let cage of data.cage) {
        let cells = [];
        for (let rxcx of cage.cells) {
            cells.push(rxcxToCell(rxcx));
        }
        let sum = cage.value !== undefined ? cage.value : '';
        let color = cage.outlineC == '#000000' ? undefined : cage.outlineC;
        let sumColor = cage.fontC == '#000000' ? undefined : cage.fontC;
        puzzle.cages.push([sum, cells, color, sumColor]);
    }
    
    puzzle.diagonals[0] = data['diagonal+'] !== undefined ? data['diagonal+'] : false;
    puzzle.diagonals[1] = data['diagonal-'] !== undefined ? data['diagonal-'] : false;
    
    data.quadruple = data.quadruple !== undefined ? data.quadruple : [];
    for (let quad of data.quadruple) {
        let cells = [
            rxcxToCell(quad.cells[0]),
            rxcxToCell(quad.cells[1]),
            rxcxToCell(quad.cells[2]),
            rxcxToCell(quad.cells[3])
        ];
        let column = Math.min(cells[0][0], cells[1][0], cells[2][0], cells[3][0]);
        let row = Math.min(cells[0][1], cells[1][1], cells[2][1], cells[3][1]);
        let digits = quad.values.slice(0, 2).join('');
        if (quad.values.length > 2) {
            digits = quad.values.slice(0, 2).join(' ') + '\n' + quad.values.slice(2, 4).join(' ');
        }
        puzzle.quads.push([digits, column, row]);
    }
    
    data.difference = data.difference !== undefined ? data.difference : [];
    for (let difference of data.difference) {
        let cells = [
            rxcxToCell(difference.cells[0]),
            rxcxToCell(difference.cells[1])
        ];
        let horizontal = cells[0][1] == cells[1][1];
        let column = Math.min(cells[0][0], cells[1][0]);
        let row = Math.min(cells[0][1], cells[1][1]);
        let value = difference.value !== undefined ? difference.value : '';
        puzzle.kropki.push([value, 'difference', column, row, horizontal]);
    }
    
    data.ratio = data.ratio !== undefined ? data.ratio : [];
    for (let ratio of data.ratio) {
        let cells = [
            rxcxToCell(ratio.cells[0]),
            rxcxToCell(ratio.cells[1])
        ];
        let horizontal = cells[0][1] == cells[1][1];
        let column = Math.min(cells[0][0], cells[1][0]);
        let row = Math.min(cells[0][1], cells[1][1]);
        let value = ratio.value !== undefined ? ratio.value : '';
        puzzle.kropki.push([value, 'ratio', column, row, horizontal]);
    }
    
    data.xv = data.xv !== undefined ? data.xv : [];
    for (let xv of data.xv) {
        let cells = [
            rxcxToCell(xv.cells[0]),
            rxcxToCell(xv.cells[1])
        ];
        let horizontal = cells[0][1] == cells[1][1];
        let column = Math.min(cells[0][0], cells[1][0]);
        let row = Math.min(cells[0][1], cells[1][1]);
        puzzle.xv.push([xv.value, column, row, horizontal]);
    }
    
    data.littlekillersum = data.littlekillersum !== undefined ? data.littlekillersum : [];
    for (let littlekillersum of data.littlekillersum) {
        let cell = rxcxToCell(littlekillersum.cell);
        let right = littlekillersum.direction[1] == 'R';
        let down = littlekillersum.direction[0] == 'D';
        puzzle.littleKillers.push([littlekillersum.value, cell[0], cell[1], right, down]);
    }
    
    data.sandwichsum = data.sandwichsum !== undefined ? data.sandwichsum : [];
    for (let sandwichsum of data.sandwichsum) {
        let cell = rxcxToCell(sandwichsum.cell);
        puzzle.sandwiches.push([sandwichsum.value, cell[0], cell[1]]);
    }
    
    data.line = data.line !== undefined ? data.line : [];
    for (let line of data.line) {
        for (let part of line.lines) {
            let path = [];
            for (let rxcx of part) {
                path.push(rxcxToCell(rxcx));
            }
            puzzle.extras.push({
                type: 'line',
                before: 'arrows',
                path: path,
                width: line.width * 50,
                color: line.outlineC == '#000000' ? undefined : line.outlineC
            });
        }
    }
    
    data.rectangle = data.rectangle !== undefined ? data.rectangle : [];
    for (let rectangle of data.rectangle) {
        let column = 0;
        let row = 0;
        for (let rxcx of rectangle.cells) {
            let cell = rxcxToCell(rxcx);
            column += cell[0];
            row += cell[1];
        }
        column /= rectangle.cells.length;
        row /= rectangle.cells.length;
        let xx = rectangle.width / 2;
        let yy = rectangle.height / 2;
        let xy = 0;
        let yx = 0;
        if (rectangle.angle !== undefined && rectangle.angle != 0) {
            let angle = rectangle.angle * Math.PI / 180;
            xy = xx * Math.sin(angle);
            xx = xx * Math.cos(angle);
            yx = -yy * Math.sin(angle);
            yy = yy * Math.cos(angle);
        }
        puzzle.extras.push({
            type: 'polygon',
            path: [[column - xx - yx, row - xy - yy], [column + xx - yx, row + xy - yy], [column + xx + yx, row + xy + yy], [column - xx + yx, row - xy + yy]],
            color: rectangle.outlineC == '#000000' ? undefined : rectangle.outlineC,
            fill: rectangle.baseC
        });
        if (rectangle.value !== undefined) {
            puzzle.extras.push({
                type: 'text',
                text: rectangle.value,
                position: [column, row],
                size: Math.min(40, 100 * rectangle.width / rectangle.value.length),
                angle: rectangle.angle,
                color: rectangle.fontC == '#000000' ? undefined : rectangle.fontC
            });
        }
    }
    
    data.circle = data.circle !== undefined ? data.circle : [];
    for (let circle of data.circle) {
        let column = 0;
        let row = 0;
        for (let rxcx of circle.cells) {
            let cell = rxcxToCell(rxcx);
            column += cell[0];
            row += cell[1];
        }
        column /= circle.cells.length;
        row /= circle.cells.length;
        puzzle.extras.push({
            type: 'circle',
            center: [column, row],
            radius: [circle.width * 50, circle.height * 50],
            angle: circle.angle,
            color: circle.outlineC == '#000000' ? undefined : circle.outlineC,
            fill: circle.baseC
        });
        if (circle.value !== undefined) {
            puzzle.extras.push({
                type: 'text',
                text: circle.value,
                position: [column, row],
                size: Math.min(40, 100 * circle.width / circle.value.length),
                angle: circle.angle,
                color: circle.fontC == '#000000' ? undefined : circle.fontC
            });
        }
    }
    
    data.text = data.text !== undefined ? data.text : [];
    for (let text of data.text) {
        let column = 0;
        let row = 0;
        for (let rxcx of text.cells) {
            let cell = rxcxToCell(rxcx);
            column += cell[0];
            row += cell[1];
        }
        column /= text.cells.length;
        row /= text.cells.length;
        puzzle.extras.push({
            type: 'text',
            text: text.value,
            position: [column, row],
            size: text.size * 80,
            angle: text.angle,
            color: text.fontC == '#000000' ? undefined : text.fontC
        });
    }
    
    console.log(puzzle);
    return puzzle;
}


function cellIndex(column, row) {
    return (row - 1) * this.size + column - 1;
}


function cellPosition(index) {
    let column = index % this.size + 1;
    let row = Math.floor(index / this.size) + 1;
    return [column, row];
}


{ // <PUZZLE FORMAT>

let puzzle = {};

puzzle.size = 9;
puzzle.title = '';
puzzle.author = '';

// Format: [[column, row], ...]
puzzle.regions = [];

// Format: [[column, row], ...]
puzzle.extraRegions = [];

// Format: [cells: [[column, row], ...], ...]
puzzle.clones = [];

// Format: [minimum?, column, row]
puzzle.fortresses = [];

// Format: [line: [[column, row], ...], ...]
puzzle.thermos = [];

// Format: [[column, row], ...]
puzzle.palindromes = [];

// Format: [[column, row], ...]
puzzle.betweenLines = [];

// Format: [cells: [[column, row], ...], [line: [[column, row], ...], ...]]
puzzle.arrows = [];

// Format: [even?, column, row]
puzzle.parity = [];

// Format: [sum, cells: [[column, row], ...], color (default: #202020), sumColor (default: #303030)]
puzzle.cages = [];

// Format: positive?, negative?
puzzle.diagonals = [false, false];

// Format: [digits, column, row]
puzzle.quads = [];

// Format: [value, type: 'difference' | 'ratio', column, row, horizontal?]
puzzle.kropki = [];

// Format: [value, column, row, horizontal?]
puzzle.xv = [];

// Format: [sum, column, row, right?, down?]
puzzle.littleKillers = [];

// Format: [sum, column, row]
puzzle.sandwiches = [];

// Format:
//   {
//     type: 'line' | 'polygon' | 'circle' | 'text',
//     before: '<constraint>' | '' (default: 'givens'),
//     options...
//   }
// Line options:
//   path: [[column, row], ...],
//   width (default: 20),
//   join: 'bevel' | 'miter' | 'round' (default: 'round'),
//   cap: 'butt' | 'square' | 'round' (default: 'round'),
//   color (default: '#404040')
// Polygon options:
//   path: [[column, row], ...],
//   width (default: 1.5),
//   color (default: '#202020'),
//   fill (default: 'none')
// Cirlce options:
//   center: [column, row],
//   radius: [x, y] (default: [40, 40]),
//   width (default: 1.5),
//   angle (default: 0),
//   color (default: '#202020'),
//   fill (default: 'none')
// Text options:
//   text,
//   position: [column, row],
//   size (default: 20),
//   halign: 'left' | 'center' | 'right' (default: 'center'),
//   valign: 'top' | 'middle' | 'bottom' (default: 'middle'),
//   angle (default: 0),
//   color (default: '#303030')
puzzle.extras = [];

// Format: [digit, column, row]
puzzle.givens = [];

// Format: [digit, column, row]
puzzle.digits = [];

// Format: [[digit, ...], column, row]
puzzle.centerMarks = [];

// Format: [[digit, ...], column, row]
puzzle.cornerMarks = [];

// Format: [[color, ...], column, row]
puzzle.colors = [];

} // </PUZZLE FORMAT>


function addBackground(puzzle, color, column, row) {
    puzzle.extras.push({
        type: 'polygon',
        before: 'thermos',
        path: [[column - 0.5, row - 0.5], [column + 0.5, row - 0.5], [column + 0.5, row + 0.5], [column - 0.5, row + 0.5]],
        color: 'none',
        fill: color
    });
}


function addSpikyLine(puzzle, path) {
    const SIN45 = Math.sin(Math.PI / 4);
    function diamondCap(c, r, w) {
        return [[c - w, r], [c, r - w], [c + w, r], [c, r + w]];
    }
    function squareCap(c, r, w) {
        w *= SIN45;
        return [[c - w, r - w], [c + w, r - w], [c + w, r + w], [c - w, r + w]];
    }
    let c1 = path[0][0];
    let r1 = path[0][1];
    let d1 = c1 != path[1][0] && r1 != path[1][1];
    let c2 = path[path.length - 1][0];
    let r2 = path[path.length - 1][1];
    let d2 = c2 != path[path.length - 2][0] && r2 != path[path.length - 2][1];
    puzzle.extras.push({
        type: 'line',
        path: path,
        width: 20,
        join: 'miter',
        cap: 'butt',
        color: '#303030'
    });
    puzzle.extras.push({
        type: 'polygon',
        path: d1 ? squareCap(c1, r1, 0.1) : diamondCap(c1, r1, 0.1),
        color: 'none',
        fill: '#303030'
    });
    puzzle.extras.push({
        type: 'polygon',
        path: d2 ? squareCap(c2, r2, 0.1) : diamondCap(c2, r2, 0.1),
        color: 'none',
        fill: '#303030'
    });
    puzzle.extras.push({
        type: 'line',
        path: path,
        width: 17,
        join: 'miter',
        cap: 'butt',
        color: '#ffffff'
    });
    puzzle.extras.push({
        type: 'polygon',
        path: d1 ? squareCap(c1, r1, 0.085) : diamondCap(c1, r1, 0.085),
        color: 'none',
        fill: '#ffffff'
    });
    puzzle.extras.push({
        type: 'polygon',
        path: d2 ? squareCap(c2, r2, 0.085) : diamondCap(c2, r2, 0.085),
        color: 'none',
        fill: '#ffffff'
    });
}
