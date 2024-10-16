import ImageGenerator from "./imageGenerator.js";

// Elements
const newButton = document.getElementById("newButton")
const sizeInput = document.getElementById("sizeInput")
const sizeOutput = document.getElementById("sizeOutput")
sizeOutput.textContent = sizeInput.value;
const mirrorCheck = document.getElementById("mirrorCheck")

// RUN
const ig = new ImageGenerator( 16 );
let seed = ig.getSeed();

ig.setInitialChildProb(1);
ig.setFinalChildProb(0);
        
ig.createNew();

let age = 1;


// Event handlers
const newClicked = () => {
    ig.createNew();
    seed = ig.getSeed();
}
const sizeChange = (value) => {
    sizeOutput.textContent = value;
    ig.setNewUnits(value);
    ig.buildShape();
    ig.paint();
}
const mirrorChanged = ()=> {
    ig.doMirror = mirrorCheck.checked;
}


// Set event handlers
newButton.addEventListener("click", newClicked);
sizeInput.addEventListener("input", (e) => sizeChange(e.target.value));
mirrorCheck.addEventListener("change", mirrorChanged);
