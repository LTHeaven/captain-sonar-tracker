var moveStringMap = {
    0: "N",
    1: "S",
    2: "W",
    3: "E"
};

var backgroundImage;
var tilePossibleImage;

var animationHandler = {
    arrowTimeMs: 0
};
var arrowAnimationDelay = 10;

var cellAmount = 15;
var canvas;
var mapSize;
var legendSize;
var cellWidth;

var drawCounter = 0;

var northButton;
var southButton;
var westButton;
var eastButton;
var resetButton;
var undoButton;

var moveStack = [];
var moveList;
var possiblePositionsStack = [];

var tilesJson;
var hoverPosition = null;

function initIslands() {
    $.getJSON("/javascripts/json/alpha.json", function (data) {
        tilesJson = data;
        resetPossiblePositions();
    });
}

function setup() {
    moveList = document.getElementById("moveList");
    initButtons();
    initIslands();
    canvas = createCanvas(1, 1);
    updateCanvas(true);
    canvas.parent('p5canvas');
    backgroundImage = loadImage("images/mapAlpha.png");
    background(backgroundImage);
    tilePossibleImage = loadImage("images/tilePossible.png");
}


function draw() {
    if (drawCounter++ > 10){
        drawCounter = 0;
        updateCanvas(false)
    }
    background(backgroundImage);
    getPossiblePositions().forEach(function (position) {
            var x = legendSize + cellWidth * position.x;
            var y = legendSize + cellWidth * position.y;
            image(tilePossibleImage, x, y, cellWidth, cellWidth);
    });
    //hoverPositionRendering
    if (hoverPosition != null) {
        var tempPosition = {
            x: hoverPosition.x,
            y: hoverPosition.y,
            moveStack: hoverPosition.moveStack.slice(0)
        };

        var count = Math.trunc((new Date().getTime()-animationHandler.arrowTimeMs)/arrowAnimationDelay + 1);
        var counter = Math.min(count, hoverPosition.moveStack.length);
        drawArrowReursive(tempPosition, counter);
    }
}

function mouseMoved() {
    if (mouseX>=0 && mouseX <= mapSize && mouseY>=0 && mouseY <= mapSize){
        if(mouseX > legendSize && mouseY > legendSize) {
            var x = Math.trunc((mouseX-legendSize)/cellWidth);
            var y = Math.trunc((mouseY-legendSize)/cellWidth);
            if(!(hoverPosition != null && hoverPosition.x == x && hoverPosition.y == y)){
                hoverPosition = getPossible(x, y);
                animationHandler.arrowTimeMs = new Date().getTime();
            }
        }
    }else{
        hoverPosition = null;
    }
}

function updateCanvas(noRedraw) {
    mapSize = document.getElementById("p5canvas").clientWidth;
    legendSize = mapSize*(30/455);
    cellWidth = (mapSize-legendSize)/cellAmount;
    resizeCanvas(mapSize, mapSize, noRedraw);
}

function initButtons() {
    northButton = document.getElementById("northButton");
    southButton = document.getElementById("southButton");
    westButton = document.getElementById("westButton");
    eastButton = document.getElementById("eastButton");
    resetButton = document.getElementById("resetButton");
    undoButton = document.getElementById("undoButton");
    northButton.addEventListener("click", function(){if(tilesJson!==undefined){enemyMove(0)}});
    southButton.addEventListener("click", function(){if(tilesJson!==undefined){enemyMove(1)}});
    westButton.addEventListener("click",  function(){if(tilesJson!==undefined){enemyMove(2)}});
    eastButton.addEventListener("click",  function(){if(tilesJson!==undefined){enemyMove(3)}});
    resetButton.addEventListener("click",  function(){if(tilesJson!==undefined){resetPossiblePositions()}});
    undoButton.addEventListener("click",  function(){if(tilesJson!==undefined){undoLastMove()}});
}

function getPossible(x, y) {
    var ret = null;
    getPossiblePositions().forEach(function (position) {
        if (position.x == x && position.y == y){
            ret = position;
        }
    });
    return ret;
}

function isIsland(x, y) {
    var result = false;
    tilesJson.forEach(function (tile) {
        if (tile.x == x && tile.y == y && tile.island == true) {
            result = true;
        }
    });
    return result;
}

function updatePossiblePositions(move) {
    nextPossiblePositions = [];
    getPossiblePositions().forEach(function (position) {
        var x = position.x;
        var y = position.y;
        switch(move) {
            case 0:
                y--;
                break;
            case 1:
                y++;
                break;
            case 2:
                x--;
                break;
            case 3:
                x++;
                break;
        }
        if (!(y < 0 || y>=cellAmount || x < 0 || x>=cellAmount || isIsland(x, y))) {
            var newPosition = {
                x: x,
                y: y,
                moveStack: position.moveStack.slice()
            };
            newPosition.moveStack.push(move);
            nextPossiblePositions.push(newPosition);
        }
    });
    possiblePositionsStack.push(nextPossiblePositions);
}

function enemyMove(direction) {
    moveStack.push(direction);
    updatePossiblePositions(direction);
    updateMoveList();
}

function undoLastMove() {
    possiblePositionsStack.pop();
    moveStack.pop();
    updateMoveList();
}

function updateMoveList(){
    if (moveList.children.length < moveStack.length) {
        var newLI = document.createElement('li');
        newLI.innerHTML = moveStringMap[moveStack[moveStack.length-1]];
        newLI.className = newLI.className + " list-group-item";
        moveList.insertBefore(newLI, moveList.getElementsByTagName('li')[0]);
        setTimeout(function() {
            newLI.className = newLI.className + " show";
        }, 40);
    } else if(moveList.children.length > moveStack.length) {
        moveList.firstChild.className = moveList.firstChild.className.replace(" show", "");
        setTimeout(function(){
            console.log(moveList);
            $($(moveList).children()[0]).remove();
            console.log(moveList);
            updateMoveList();
        }, 40);
    }
}

function resetPossiblePositions(){
    possiblePositionsStack = [];
    var possiblePositions = [];
    for (var i = 0; i < cellAmount; i++) {
        for (var j = 0; j < cellAmount; j++) {
            if (!isIsland(i, j)){
                var position = {
                    x: i,
                    y: j,
                    moveStack: []
                };
                possiblePositions.push(position);
            }
        }
    }
    possiblePositionsStack.push(possiblePositions);
    moveStack = [];
    updateMoveList();
}

function drawArrowReursive(tempPosition, counter) {
    if (tempPosition.moveStack.length > 0 && counter > 0){
        var x = tempPosition.x;
        var y = tempPosition.y;
        var arrowDivider = 8;
        noFill();
        switch(tempPosition.moveStack.pop()) {
            case 0:
                tempPosition.y++;
                triangle((cellWidth*x)+legendSize+cellWidth/2, (cellWidth*y)+legendSize+cellWidth/2, (cellWidth*x)+legendSize+cellWidth/2-cellWidth/arrowDivider, (cellWidth*(y+1))+legendSize+cellWidth/2, (cellWidth*x)+legendSize+cellWidth/2+cellWidth/arrowDivider, (cellWidth*(y+1))+legendSize+cellWidth/2)
                break;
            case 1:
                tempPosition.y--;
                triangle((cellWidth*x)+legendSize+cellWidth/2, (cellWidth*y)+legendSize+cellWidth/2, (cellWidth*x)+legendSize+cellWidth/2-cellWidth/arrowDivider, (cellWidth*(y-1))+legendSize+cellWidth/2, (cellWidth*x)+legendSize+cellWidth/2+cellWidth/arrowDivider, (cellWidth*(y-1))+legendSize+cellWidth/2)
                break;
            case 2:
                tempPosition.x++;
                triangle((cellWidth*x)+legendSize+cellWidth/2, (cellWidth*y)+legendSize+cellWidth/2, (cellWidth*(x+1))+legendSize+cellWidth/2, (cellWidth*y)+legendSize+cellWidth/2-cellWidth/arrowDivider, (cellWidth*(x+1))+legendSize+cellWidth/2, (cellWidth*y)+legendSize+cellWidth/2+cellWidth/arrowDivider);
                break;
            case 3:
                tempPosition.x--;
                triangle((cellWidth*x)+legendSize+cellWidth/2, (cellWidth*y)+legendSize+cellWidth/2, (cellWidth*(x-1))+legendSize+cellWidth/2, (cellWidth*y)+legendSize+cellWidth/2-cellWidth/arrowDivider, (cellWidth*(x-1))+legendSize+cellWidth/2, (cellWidth*y)+legendSize+cellWidth/2+cellWidth/arrowDivider);
                break;
        }
        if (tempPosition.moveStack.length == 0){
            noStroke();
            fill(0, 10, 200, 50);
            rect(tempPosition.x*cellWidth+legendSize, tempPosition.y*cellWidth+legendSize, cellWidth, cellWidth);
            stroke(0,0,0);
        }
        drawArrowReursive(tempPosition, --counter);
    }
}

function getPossiblePositions() {
    if (possiblePositionsStack.length == 0){
        return [];
    }
    return possiblePositionsStack[possiblePositionsStack.length - 1];
}
