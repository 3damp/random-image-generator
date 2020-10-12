
// RUN
const ig = new ImageGenerator( 16 );

ig.setInitialChildProb(1);
ig.setFinalChildProb(0);
        
ig.autoRun();


// Listeners
const newClicked = ()=> {
    ig.autoRun();
}
const sizeChange = (value)=> {
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
const newShapeClicked = ()=> {
    ig.createNewShape();
    ig.paint();
}
const newColors = ()=> {
    ig.randomizeColors();
    ig.paint();
}
