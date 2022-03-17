
function chooseAction(hand, pick, draw, timber){
    console.log("strategy.draw")

    //timber 
    const currentScore = hand.reduce((p, c) => p + c.value, 0);
        //as soon as possible
        if(currentScore <= 7) {
            timber();
            return;
        }
        //depending on others nb of cards 
    //action
        //always draw
        draw();
        //always pick first
        //always pick last
        //draw if min(discard) > max (hand)
        //pick if min(discard) < max (hand)
        //pick if allow combo 
}

function discard(hand, action){
    console.log("strategy.discard")
    //discard
        // last
        action([hand[hand.length-1]].map(c => {return {name: c.filename}}));
        // max combo
        // max (last, combo)
        // discard if all others have been played
    
}

module.exports = {
    chooseAction: chooseAction,
    discard: discard
}