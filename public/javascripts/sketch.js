var moveStringMap = {
    0: "N",
    1: "S",
    2: "W",
    3: "E"
};

var backgroundImage;
var tilePossibleImage;
var sectorDeselectedImage;
var sectorSelectedImage;

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

var buttonHandler;

var moveStack = [];
var moveList;
var possiblePositionsStack = [];

var tilesJson;
var hoverPosition = null;

var appStates = {
    DEFAULT: 0,
    SONAR: 1
};
var currentAppState = appStates.DEFAULT;

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
    sectorDeselectedImage = loadImage("images/sectorDeselected.png");
    sectorSelectedImage = loadImage("images/sectorSelected.png");
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
    if (currentAppState == appStates.SONAR) {
        var sectorWidth = cellWidth*5;
        for (var i = 0; i < 9; i++){
            console.log(mouseX);
            if (getSectorByPoint(mouseX, mouseY) == i){
                image(sectorSelectedImage, legendSize + (i%3)*sectorWidth, legendSize + Math.trunc(i/3)*sectorWidth, sectorWidth, sectorWidth);
            }else{
                image(sectorDeselectedImage, legendSize + (i%3)*sectorWidth, legendSize + Math.trunc(i/3)*sectorWidth, sectorWidth, sectorWidth);
            }

        }
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

function getSectorByPoint(x, y){
    if (x>legendSize && x < mapSize && y>legendSize && y < mapSize) {
        return Math.trunc((x-legendSize)/(cellWidth*5)) + Math.trunc((y-legendSize)/(cellWidth*5))*3;
    }
    return null;
}

function updateCanvas(noRedraw) {
    mapSize = document.getElementById("p5canvas").clientWidth;
    legendSize = mapSize*(30/455);
    cellWidth = (mapSize-legendSize)/cellAmount;
    resizeCanvas(mapSize, mapSize, noRedraw);
}

function initButtons() {
    buttonHandler = {
        buttons: {
            northButton:    initButton("northButton",   function(){enemyMove(0)}),
            southButton:    initButton("southButton",   function(){enemyMove(1)}),
            westButton:     initButton("westButton",    function(){enemyMove(2)}),
            eastButton:     initButton("eastButton",    function(){enemyMove(3)}),
            resetButton:    initButton("resetButton",   function(){resetPossiblePositions()}),
            undoButton:     initButton("undoButton",    function(){undoLastMove()}),
            sonarButton:    initButton("sonarButton",   function(){sonar()}),
            stealthButton:  initButton("stealthButton", function(){console.log("todo")}),
            droneButton:    initButton("droneButton",   function(){console.log("todo")})
        },
        setAllButtonsEnabled: function (isEnabled) {
            for (var key in this.buttons) {
                if (!this.buttons.hasOwnProperty(key)) continue;
                this.buttons[key].setEnabled(isEnabled);
            }
        }
    };

    function initButton(id, listenerFunction) {
        var button = {
            buttonElement: document.getElementById(id),
            setEnabled: function (isEnabled) {
                this.buttonElement.disabled = !isEnabled;
            }
        };
        button.buttonElement.addEventListener("click", function(){if(tilesJson!==undefined)listenerFunction()});
        return button;
    }
}

function sonar() {
    buttonHandler.setAllButtonsEnabled(false);
    currentAppState = appStates.SONAR;
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
    if (possiblePositionsStack.length > 1){
        possiblePositionsStack.pop();
        moveStack.pop();
        updateMoveList();
    }
}

function updateMoveList(){
    if (moveList.children.length < moveStack.length) {
        var newLI = document.createElement('li');
        newLI.innerHTML = moveStringMap[moveStack[moveStack.length-1]];
        newLI.className = newLI.className + " list-group-item list-group-item-primary";
        moveList.insertBefore(newLI, moveList.getElementsByTagName('li')[0]);
        setTimeout(function() {
            newLI.className = newLI.className + " show";
        }, 10);
    } else if(moveList.children.length > moveStack.length) {
        moveList.firstChild.className = moveList.firstChild.className.replace(" show", "");
        setTimeout(function(){
            console.log(moveList);
            $($(moveList).children()[0]).remove();
            console.log(moveList);
            updateMoveList();
        }, 10);
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