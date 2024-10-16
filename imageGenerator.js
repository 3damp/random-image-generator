//--------------------------------
// Random Image Generator v0.5.3
// 
// Armand M. 
// 2020
//--------------------------------

export default class ImageGenerator {

    /**
     * Create a new instance and assign it to a canvas element.
     * @param {*} sideUnits number of cells (big pixels) per side.
     * @param {*} canvasId element id of the canvas.
     */
    constructor(sideUnits, canvasId) {
        // ## Init ##
        this.canvas = document.getElementById(canvasId || 'canvas');
        this.context = this.canvas.getContext("2d");
        this.age = 100;
        // units
        this.setNewUnits(sideUnits);
        
        // generator params
        this.initialChildProbability = 1;
        this.finalChildProbability = 0;
        
        this.initialMinChildrenPerCell = 0;
        this.finalMinChildrenPerCell = 0;
        
        this.initialMaxChildrenPerCell = 4;
        this.finalMaxChildrenPerCell = 4;
        
        this.doMirror = true;
        
        // init colors
        this.currentColorValue = 255; // for gradient white to black
        
        // adjacent cell randomizer
        this.positionPool = new PositionPool();
        
        this.randomizeColors();
        this.setNewSeed();
    };

    setNewUnits(sideUnits) {
        if (sideUnits < 2) sideUnits = 2; // limit
        if (sideUnits > 512) sideUnits = 512; // limit
        this.sideUnits = parseInt(sideUnits) || 16; // cells per row/column
        this.pixelRatio = this.canvas.width / this.sideUnits;
        this.startingCell = new Cell( Math.floor(0.5 * this.sideUnits -1), Math.floor(0.5 * this.sideUnits -1) ); // center of screen
        this.initCells();
    };

    setNewSeed(seed) {
        rnd.setNewSeed(seed);
    };

    getSeed() {
        return rnd.seed;
    };

    initCells() {
        this.cells = new Array(this.sideUnits);
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i] = new Array(this.sideUnits);
        }
    }

    createNew() {
        rnd.setNewSeed();
        this.randomizeColors();
        this.createCellsFloodFill(this.startingCell.x, this.startingCell.y)
        if (this.doMirror) this.mirrorImage();
        this.paint();
    };

    buildShape() {
        this.createCellsFloodFill(this.startingCell.x, this.startingCell.y)
        if (this.doMirror) this.mirrorImage();
    }

    /**
     * Set colors to new random colors
     */
    randomizeColors() {
        this.backgroundColor = this.randomColor();
        this.color1 = this.randomColor();
        this.color2 = this.randomColor();
    }

    /**
     * Draw on canvas the already generated image.
     */
    paint() {
        this.drawBackground();
        // draw all cells
        for (let i = 0; i < this.cells.length; i++) {
            for (let j = 0; j < this.cells[i].length; j++) {
                if (this.cells[i][j] === Cell.CellState.Processed) {
                    this.setColor(this.color1);
                    this.drawRect(i,j,1,1);
                } else if (this.cells[i][j] === Cell.CellState.Dead) {
                    this.setColor(this.color2);
                    this.drawRect(i,j,1,1);
                } else if (this.cells[i][j] === Cell.CellState.Growing) {
                    this.setColor(this.color2);
                    this.drawRect(i,j,1,1);
                }
            }            
        }
    };

    /**
     * Start image creation by specifying a starting point to draw from. (Flood Fill algorithm without recursion)
     * @param {*} x X in cell units (not real pixels)
     * @param {*} y Y in cell units (not real pixels)
     */
    createCellsFloodFill(x, y) {
        this.initCells();
        rnd.reset();
        const queue = [];
        // add first cell
        queue.push(new Cell(x, y));
        this.cells[x][y] = Cell.CellState.Growing;
        let iAge = this.age;

        // return if empty
        while (queue.length > 0 && iAge > 0) {
            iAge--;
            // get first in queue
            const cell = queue.shift();
            this.cells[cell.x][cell.y] = Cell.CellState.Processed;
            
            // create childs
            let pos;
            let numChildrenCreated = 0;

            const posPool = new PositionPool();

            // do this for each possible new position:
            while ((pos = posPool.getPos()) != null) {
                const newX = cell.x + pos[0];
                const newY = cell.y + pos[1];

                if ( this.isPosValid(newX, newY)                // IF:  cell is inside viewport
                && this.cells[newX][newY] === undefined         //      cell has not been processed
                && !queue.some(e => e.equals(newX, newY)) ) {   //      cell is not in the queue yet
                    
                    const params = this.getParamsForCell(newX, newY);
                    
                    if ( (rnd.random() < params.childProbability || numChildrenCreated < params.minChildrenPerCell) && numChildrenCreated < params.maxChildrenPerCell) {
                        // add new cell
                        queue.push(new Cell(newX, newY));
                        this.cells[newX][newY] = Cell.CellState.Growing;

                        numChildrenCreated++;
                    }else{
                        // add ending cell
                        this.cells[newX][newY] = Cell.CellState.Dead;
                    }
                }
            }
        }
    };
    
    /**
     * Start image creation by specifying a starting point to draw from. (Recursion version)
     * @param {*} x X in cell units (not real pixels)
     * @param {*} y Y in cell units (not real pixels)
     */
    createCellsRecursion(x, y) {
        this.initCells();
        this.cells[x][y] = 0;

        this.crtCellRec(x, y);
    }
    
    /**
     * Recursive function to create every cell.
     * @param {*} x 
     * @param {*} y 
     */
    crtCellRec(x, y) {
        // create childs
        let pos;
        let numChildrenCreated = 0;

        const pPool = new PositionPool();
        while ((pos = pPool.getPos()) != null) {
            const newX = x + pos[0];
            const newY = y + pos[1];
             
            if ( this.isPosValid(newX, newY) 
            && this.cells[newX][newY] === undefined ) {

                const params = this.getParamsForCell(newX, newY);
                if ( (rnd.random() < params.childProbability || numChildrenCreated < params.minChildrenPerCell) && numChildrenCreated < params.maxChildrenPerCell) {
                    numChildrenCreated++;
                    this.cells[newX][newY] = 0;
                    this.crtCellRec(newX, newY);
                    //  setTimeout(() => this.createCellRecursion(newX, newY), 0);
                }else{
                    this.cells[newX][newY] = 1;
                }
            }
        }        
    }

    /**
     * Return true if the specified position (in cell units) is inside the viewport.
     * @param {*} x 
     * @param {*} y 
     */
    isPosValid(x,y) {
        const widthAvailable = this.doMirror ? this.sideUnits/2 : this.sideUnits;
        return (0 <= x && x < widthAvailable) && (0 <= y && y < this.sideUnits);
    };

    /**
     * Mirrors the created image
     */
    mirrorImage(){
        const lengthX = this.cells.length;
        const mirrorStartPoint = Math.floor(lengthX/2);
        for (let i = mirrorStartPoint; i < lengthX; i++) {
            for (let j = 0; j < this.cells[i].length; j++) {
                this.cells[i][j] = this.cells[lengthX-1-i][j]
            }            
        }
    };

    setColor(color) {
        this.context.fillStyle = color;
    };

    drawBackground() {
        this.setColor(this.backgroundColor);
        this.drawRect( 0, 0, this.sideUnits, this.sideUnits );
    };

    /**
     * Used to paint with gradient. It returns a darker color every time.
     */
    getCurrentColor() {
        const step = 2;
        const v = this.currentColorValue;
        if (this.currentColorValue >= step) {
            this.currentColorValue-=step;
        }
        return `rgb(${v},${v},${v})`
    }

    /**
     * Generates a random color.
     */
    randomColor() {
        const r = rnd.random() * 255;
        const g = rnd.random() * 255;
        const b = rnd.random() * 255;
    
        return `rgb(${r},${g},${b})`
    };

    /**
     * Draw a rectangle
     * @param {number} x x position
     * @param {number} y y position
     * @param {number} w width
     * @param {number} h height
     */
    drawRect(x, y, w, h) {
        this.context.fillRect(this.toPixels(x), this.toPixels(y), this.toPixels(w), this.toPixels(h));
    };

    /**
     * Return parameters for a specific cell
     * @param {*} x 
     * @param {*} y 
     */
    getParamsForCell(x, y) {
        const depth = this.getPointDepth(x,y);
        return {
            childProbability: this.initialChildProbability - depth * ( this.initialChildProbability - this.finalChildProbability ),
            minChildrenPerCell: this.initialMinChildrenPerCell - depth * ( this.initialMinChildrenPerCell - this.finalMinChildrenPerCell ),
            maxChildrenPerCell: this.initialMaxChildrenPerCell - depth * ( this.initialMaxChildrenPerCell - this.finalMaxChildrenPerCell ),
        }
    };

    /**
     * Converts from units to pixels.
     * @param {*} value 
     */
    toPixels(value) {
        return value * this.pixelRatio
    };

    /**
     * Returns the depth of a specific point. (from 0 to 1)
     *  0 = center of the screen
     *  1 = edge of the screen
     * @param {*} x 
     * @param {*} y 
     */
    getPointDepth(x,y) {
        const radius = (this.sideUnits/2);
        const relX = (x - radius)/radius;
        const relY = (y - radius)/radius;
        return Math.min( Math.sqrt( relX*relX + relY*relY ), 1);
    };

    setDoMirror(value) {
        if (value === true || value === false) this.doMirror = value;
    }
    setInitialChildProb(value) {
        const floatValue = parseFloat(value);
        if (!isNaN(floatValue)) this.initialChildProbability = floatValue;
    }
    setFinalChildProb(value) {
        const floatValue = parseFloat(value);
        if (!isNaN(floatValue)) this.finalChildProbability = floatValue;
    }
    setInitialMinChildren(value) {
        const intValue = parseInt(value);
        if (!isNaN(intValue)) this.initialMinChildrenPerCell = intValue;
    }
    setFinalMinChildren(value) {
        const intValue = parseInt(value);
        if (!isNaN(intValue)) this.finalMinChildrenPerCell = intValue;
    }
    setInitialMaxChildren(value) {
        const intValue = parseInt(value);
        if (!isNaN(intValue)) this.initialMaxChildrenPerCell = intValue;
    }
    setFinalMaxChildren(value) {
        const intValue = parseInt(value);
        if (!isNaN(intValue)) this.finalMaxChildrenPerCell = intValue;
    }
};

/**
 * Cell class
 */
class Cell {
    static CellState = {
        Processed: 0,
        Dead: 1,
        Growing: 2,
    }
    
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    equals(x,y) {
        return this.x === x && this.y === y;
    }
};

/**
 * Get a random unique relative position. 
 *  UP = [0,-1], RIGHT = [1,0], DOWN = [0,1], LEFT = [-1,0]
 */
class PositionPool {
    constructor() {
        this.pool = [[0,-1], [1,0], [0,1], [-1,0]];
        this.currentLength = this.pool.length;
    }
    getPos() {
        if (this.currentLength < 1) {
            return null
        }
        const randomIndex = Math.floor(rnd.random() * this.currentLength);
        const result = this.pool[randomIndex];
        // swap entries and reduce length to remove used options from pool.
        this.pool[randomIndex] = this.pool[this.currentLength-1] 
        this.currentLength--;

        return result;
    }
};

/**
 * Pseudorandom number generator.
 */
class PseudorandomGenerator {
    constructor(seed) {
        this.setNewSeed(seed);
    }
    
    random() {
        this.currentRandom = this.mulberry32(this.currentRandom);
        return this.currentRandom;
    }

    reset() {
        this.setNewSeed(this.seed);
    }

    setNewSeed(seed) {
        this.seed = seed || this.createRandomSeed(6);
        this.currentRandom = this.stringToNumber(this.seed);
    }
    
    createRandomSeed(length) {
        return Math.random().toString(36).substr(2,length).toUpperCase();
    }

    stringToNumber(string) {
        const maxLength = 100;
        let result = 1;

        if(!string) return result;

        string = string.toLowerCase();
        if (string.length > maxLength) string = string.substring(0, maxLength);
        for (let i = 0; i < string.length; i++) {
            result *= string.charCodeAt(i);
        }
        return result;
    }

    /**
     * Return a new pseudorandom number.
     * @param {*} prevValue Previous pseudorandom number.
     */
    mulberry32(prevValue) {
        prevValue *= 100000000;
        var t = prevValue += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

const rnd = new PseudorandomGenerator();