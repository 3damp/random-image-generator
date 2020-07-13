// 
// Armand M.
//--------------------------------



class ImageGenerator {
    
    constructor(sideUnits) {
        this.sideUnits = sideUnits || 16; // cells per row/column
        this.canvas = document.getElementById('canvas');
        this.context = this.canvas.getContext("2d");
        this.pixelRatio = this.canvas.width / this.sideUnits;

        this.backgroundColor = this.genColor();
        this.color1 = this.genColor();
        this.color2 = this.color1;
        this.color2 = this.genColor();
        this.cVal = 255;

        this.cells = Array(this.sideUnits);
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i] = Array(this.sideUnits);
        }

        this.positionPool = new PositionPool();
        this.childProbability = 0.5;
        this.minChildrenPerCell = 0;
        this.maxChildrenPerCell = 4;

    };

    paint() {
        // paint background
        this.drawBackground();

        // draw all cells
        for (let i = 0; i < this.cells.length; i++) {
            for (let j = 0; j < this.cells[i].length; j++) {
                if (this.cells[i][j] === true) {
                    this.setColor(this.color1);
                    this.drawRect(i,j,1,1);
                } else if (this.cells[i][j] === false) {
                    this.setColor(this.color2);
                    this.drawRect(i,j,1,1);
                }
            }            
        }
    };

    drawBackground() {
        this.setColor(this.backgroundColor);
        this.drawRect( 0, 0, this.sideUnits, this.sideUnits );
    };

    createCells(x, y) {
        const queue = Array();
        // add cell
        queue.push(new Cell(x, y));
        this.cells[x][y] = true;

        this.createC(queue);
    };
    
    createC(queue) {
        // return if empty
        if(queue.length <= 0) return;

        // get first in queue
        const cell = queue.shift();

        // process first in queue
        this.setColor(this.getCurrentColor());
        this.drawRect(cell.x, cell.y, 1, 1);

        // create childs
        let pos;
        let numChildrenCreated = 0;
        while ((pos = this.positionPool.getPos()) != null) {
            const newX = cell.x + pos[0];
            const newY = cell.y + pos[1];
            
            if ( this.isPosValid(newX, newY) 
            && this.cells[newX][newY] === undefined
            && !queue.some(e => e.equals(newX, newY)) ) {
                
                if(this.updateParamsForEveryCell) this.updateParamsForEveryCell(newX, newY);

                if ( (Math.random() < this.childProbability || numChildrenCreated < this.minChildrenPerCell) && numChildrenCreated < this.maxChildrenPerCell) {
                    queue.push(new Cell(newX, newY));
                    this.cells[newX][newY] = true;
                    numChildrenCreated++;
                }else{
                    this.setColor('black');
                    this.drawRect(newX,newY,1,1);
                    this.cells[newX][newY] = false;
                }
            }
        }
        // reset positionPool
        this.positionPool = new PositionPool();

        // recurse
        this.createC(queue);
    }

    isPosValid(x,y) {
        return (0 <= x && x < this.sideUnits) && (0 <= y && y < this.sideUnits);
    }

    /**
     * Mirrors the created image
     */
    mirror(){
        const lengthX = this.cells.length;
        const startPoint = Math.floor(lengthX/2);
        for (let i = startPoint; i < lengthX; i++) {
            for (let j = 0; j < this.cells[i].length; j++) {
                this.cells[i][j] = this.cells[lengthX-1-i][j]
            }            
        }
    };

    setColor(color) {
        this.context.fillStyle = color;
    };

    /**
     * User to paint with gradient. It returns a darker color every time.
     */
    getCurrentColor() {
        const step = 2;
        const v = this.cVal;
        if (this.cVal >= step) {
            this.cVal-=step;
        }
        return `rgb(${v},${v},${v})`
    }

    /**
     * Generates a random color.
     */
    genColor() {
        const r = Math.random() * 255;
        const g = Math.random() * 255;
        const b = Math.random() * 255;
    
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
     * Override to change parameters on every createCell()
     * @param {*} x 
     * @param {*} y 
     */
    updateParamsForEveryCell(x, y) {};

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
        const radius = (this.sideUnits/2)-1;
        const relX = (x - radius)/radius;
        const relY = (y - radius)/radius;
        return Math.min( Math.sqrt( relX*relX + relY*relY ), 1);
    };

    
};

/**
 * Cell class
 */
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    equals(x,y) {
        return this.x === x && this.y === y;
    }
};

/**
 * Get a random unique position
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
        const randomIndex = Math.floor(Math.random() * this.currentLength);
        const result = this.pool[randomIndex];
        // swap entries
        this.pool[randomIndex] = this.pool[this.currentLength-1] 
        this.currentLength--;
        return result;
    }
};


// RUN

const ig = new ImageGenerator( 16 );
ig.drawBackground();

ig.updateParamsForEveryCell = function(x, y) {
    const baseProb = 1;
    this.childProbability = baseProb - baseProb * this.getPointDepth(x, y);
    // if (this.getPointDepth(x,y) < 0.3) {
    //     this.minChildrenPerCell = 4;
    //     this.maxChildrenPerCell = 4;
    // } else {
    //     this.minChildrenPerCell = 1;
    //     this.maxChildrenPerCell = 1;
    // }
    // console.log(`${x}, ${y} - ${this.getPointDepth(x,y)}`)
    // console.log('B: '+ this.minChildrenPerCell)
}
        
ig.createCells(Math.floor(0.9*ig.sideUnits/2)-1, Math.floor(ig.sideUnits/2)-1)
        
// ig.setColor(ig.color1)
ig.mirror()
ig.paint();
        

