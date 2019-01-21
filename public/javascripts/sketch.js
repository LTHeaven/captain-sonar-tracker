var backgroundImage;
var tilePossibleImage;

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

var moveStack = [];
var possiblePositions = [];

var tilesJson;
var hoverPosition = null;

function initIslands() {
    $.getJSON("/javascripts/json/alpha.json", function (data) {
        tilesJson = data;
        resetPossiblePositions();
    });
}

function setup() {
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
    possiblePositions.forEach(function (position) {
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
        drawArrowReursive(tempPosition);
    }
}

function mouseMoved() {
    if (mouseX>=0 && mouseX <= mapSize && mouseY>=0 && mouseY <= mapSize){
        if(mouseX > legendSize && mouseY > legendSize) {
            var x = Math.trunc((mouseX-legendSize)/cellWidth);
            var y = Math.trunc((mouseY-legendSize)/cellWidth);
            if(!(hoverPosition != null && hoverPosition.x == x && hoverPosition.y == y)){
                hoverPosition = getPossible(x, y);
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
    northButton.addEventListener("click", evt => {if(tilesJson!=undefined){enemyMove(0)}});
    southButton.addEventListener("click", evt => {if(tilesJson!=undefined){enemyMove(1)}});
    westButton.addEventListener("click",  evt => {if(tilesJson!=undefined){enemyMove(2)}});
    eastButton.addEventListener("click",  evt => {if(tilesJson!=undefined){enemyMove(3)}});
    resetButton.addEventListener("click",  evt => {if(tilesJson!=undefined){resetPossiblePositions()}});
}

function getPossible(x, y) {
    var ret = null;
    possiblePositions.forEach(function (position) {
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
    possiblePositions.forEach(function (position) {
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
            position.x = x;
            position.y = y;
            position.moveStack.push(move);
            nextPossiblePositions.push(position);
        }
    });
    possiblePositions = nextPossiblePositions;
}

function enemyMove(direction) {
    moveStack.push(direction);
    updatePossiblePositions(direction);
}

function resetPossiblePositions(){
    possiblePositions = [];
    for (var i = 0; i<cellAmount; i++) {
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
}

function drawArrowReursive(tempPosition) {
    if (tempPosition.moveStack.length > 0){
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
        drawArrowReursive(tempPosition);
    }
}
