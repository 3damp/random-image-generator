
// RUN
const ig = new ImageGenerator( 32 );
let seed = ig.getSeed();

ig.setInitialChildProb(1);
ig.setFinalChildProb(0);
        
ig.autoRun(100);

let age = 1;

// Listeners
const newClicked = () => {
    ig.autoRun(100);
    seed = ig.getSeed();
}

const sizeChange = (value) => {
    document.getElementById("sizeOut").innerHTML = value;
    ig.setNewUnits(value);
}
const mirror = ()=> {
    if (document.getElementById('mirrorCheck').checked) {
        console.log('mirrorON')
        ig.doMirror = true;
    } else {
        ig.doMirror = false;
    }
}
const buttonAHandler = () => {
    // create new shape on age 1
    age = 1;
    ig.setNewSeed();
    ig.autoRun(age);
    seed = ig.getSeed();
    // ig.createNewShape(age);
    // ig.paint();
}
const buttonBHandler = () => {
    // add age using the same seed
    age++;
    ig.setNewSeed(seed);
    ig.autoRun(age);
    // ig.randomizeColors();
    // ig.paint();
}
