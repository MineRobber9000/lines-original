// add field (9 by 9)
var field = [	[0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0]];
// search field (for pathfinding)
var search_field = [];
// list of (empty) cells.
var forRandom = [];
// selected cell
var selected = null;
// main game background
var bg = null;
// the destination of the ball that is in motion
var moving = false;
// a list of balls that are to be removed
var removing = false;
// the cell where the moving ball started
var start = null;
// the score
var score = 0;
// the score record (read from cookies)
var record = readCookie("lines-score");
// the selection cursor
var selection = null;
// call init when the window is loaded
onload = init;

// loads in ball images
for (var i = 0; i < 7; i++) {
	eval('var img' + i + ' = new Image();img' + i + '.src = "i/ball' + i + '.png";');
}
// loads in selection cursor
var imgsel = new Image();
imgsel.src = "i/selection.png";

// inits game state
function init()
{
	bg = document.getElementById("bg");
	for (var i = 0; i < 9; i++) {
		for (var j = 0; j < 9; j++) {
			forRandom.push({x:i,y:j}); // add location to empty cell list
			var div = document.createElement("div"); // create cell div
			div.style.left = i * 50 + "px";
			div.style.top = j * 50 + "px";
			div.x = i;
			div.y = j;
			div.path = null;
			div.move = null;
			div.removing = 100;
			div.onclick = cellClick;
			div.id = "cell-" + i + "-" + j;
			bg.appendChild(div); // add to game field
		}
	}
	forecast(); // get ball colors
	document.getElementById("record").innerHTML = (record)?record:0;
	dropBalls(); // drop first 3 balls
	document.getElementById("forecast").onclick = dropBalls;
	setInterval(Step, 1); // set Step to run every second

	selection = document.getElementById("selection"); // get selection cursor
	selection.jumpTo = function(x, y)
	{
		this.style.top = 50 * y + "px";
		this.style.left = 50 * x + "px";
		this.style.display = "block";
	};
	selection.hide = function()
	{
		this.style.display = "none";
	};
	setTimeout(scrollTo, 100, 0, 15);
}

// function called when cell is clicked
function cellClick()
{
	if (moving || removing) return; // don't do anything while a ball is in motion or being removed
	if (this.className) { // did you click on a cell with a ball? if so, select ball
		selected = this;
		selection.jumpTo(this.x, this.y);
	} else {
		if (selected) { // if not, and there already is a selection, try to move there
			var path = findPath(selected.x, selected.y, this.x, this.y);
			if (path) {
				selected.path = path;
				moving = selected;
				start = {x:selected.x, y:selected.y};
				selection.hide();
				selected = null;
			}
		}
	}
}

// animates moving balls, is also responsible for scoring
function Step()
{
	var step = 10;
	if (!moving && !removing) return;
	if (moving) {
		if (moving.move) {
			if (moving.move == "u") {
				moving.style.marginTop = (!moving.style.marginTop)?0:(parseInt(moving.style.marginTop) - step + "px");
				if (parseInt(moving.style.marginTop) == -50) finish(moving.x, moving.y*1 - 1);
			}
			if (moving.move == "d") {
				moving.style.marginTop = (!moving.style.marginTop)?0:(parseInt(moving.style.marginTop) + step + "px");
				if (parseInt(moving.style.marginTop) == 50) finish(moving.x, moving.y*1 + 1);
			}
			if (moving.move == "l") {
				moving.style.marginLeft = (!moving.style.marginLeft)?0:(parseInt(moving.style.marginLeft) - step + "px");
				if (parseInt(moving.style.marginLeft) == -50) finish(moving.x*1 - 1, moving.y);
			}
			if (moving.move == "r") {
				moving.style.marginLeft = (!moving.style.marginLeft)?0:(parseInt(moving.style.marginLeft) + step + "px");
				if (parseInt(moving.style.marginLeft) == 50) finish(moving.x*1 + 1, moving.y);
			}
		} else {
			moving.move = moving.path.pop();
		}
	} else {
		var removed = false;
		for (var i = 0; i < removing.length; i++) {
			var cell = document.getElementById("cell-" + removing[i].x + "-" + removing[i].y);
			if (cell.removing == 0) {
				cell.removing = 100;
				cell.className = "";
				field[removing[i].x][removing[i].y] = 0;
				forRandom.push({x:removing[i].x,y:removing[i].y});
				removed = true;
			} else {
				cell.removing -= 50;
				cell.className = "ball0";
			}
		}
		if (removed) {
			score += 10 + 4 * (removing.length - 5);
			document.getElementById("score").innerHTML = score;
			if (score > record) {
				record = score;
				document.getElementById("record").innerHTML = record;
				createCookie("lines-score", record, 365);
			}
			removing = false;
		}
	}
}

// function responsible for actually moving the visible ball
function finish(x, y)
{
	var next = document.getElementById("cell-" + x + "-" + y);
	if (!next) {
		moving = false;
		return;
	}
	next.className = moving.className;
	moving.className = "";
	moving.style.marginTop = 0;
	moving.style.marginLeft = 0;
	if (!moving.path.length) { // is the path done? if so, clean up and check for a possible score
		moving.path = null;
		moving.move = null;
		moving = false;
		replaceRandom(x, y, start.x, start.y);
		field[x][y] = field[start.x][start.y];
		field[start.x][start.y] = 0;
		if (!checktheBall(x, y)) dropBalls();
	} else { // otherwise update moving cell
		next.path = moving.path;
		moving.path = null;
		moving.move = null;
		next.move = next.path.pop();
		moving = next;
	}
}


// finds a path between (x1,y1) and (x2,y2). not gonna pretend I understand a lick of it but it's here.
function findPath(x1, y1, x2, y2)
{
	var steps = Array();
	search_field = Array(Array(-1,-1,-1,-1,-1,-1,-1,-1,-1),Array(-1,-1,-1,-1,-1,-1,-1,-1,-1),Array(-1,-1,-1,-1,-1,-1,-1,-1,-1),
				Array(-1,-1,-1,-1,-1,-1,-1,-1,-1),Array(-1,-1,-1,-1,-1,-1,-1,-1,-1),Array(-1,-1,-1,-1,-1,-1,-1,-1,-1),
				Array(-1,-1,-1,-1,-1,-1,-1,-1,-1),Array(-1,-1,-1,-1,-1,-1,-1,-1,-1),Array(-1,-1,-1,-1,-1,-1,-1,-1,-1));
	for (var i = 0; i < 9; i++) {
		for (var j = 0; j < 9; j++) {
			if (field[i][j] != 0) {
				search_field[i][j] = -2;
			}
		}
	}
	search_field[x1][y1] = 0;
	steps.push({x:x1, y:y1, step:0});
	var i = 0;
	while (true) {
		i++;
		if (!steps.length) {
			i = 85;
			break;
		}
		var cell = steps.shift();
		if (cell.y != 0 && search_field[cell.x][cell.y - 1] == -1) {
			steps.push({x:cell.x, y:cell.y - 1, step:cell.step + 1});
			search_field[cell.x][cell.y - 1] = cell.step + 1;
		}
		if (cell.y != 8 && search_field[cell.x][cell.y + 1] == -1) {
			steps.push({x:cell.x, y:cell.y + 1, step:cell.step + 1});
			search_field[cell.x][cell.y + 1] = cell.step + 1;
		}
		if (cell.x != 0 && search_field[cell.x - 1][cell.y] == -1) {
			steps.push({x:cell.x - 1, y:cell.y, step:cell.step + 1});
			search_field[cell.x - 1][cell.y] = cell.step + 1;
		}
		if (cell.x != 8 && search_field[cell.x + 1][cell.y] == -1) {
			steps.push({x:cell.x + 1, y:cell.y, step:cell.step + 1});
			search_field[cell.x + 1][cell.y] = cell.step + 1;
		}

		if ((cell.x == x2 && cell.y - 1 == y2) || (cell.x == x2 && cell.y + 1 == y2) ||
			(cell.x - 1 == x2 && cell.y == y2) || (cell.x + 1 == x2 && cell.y == y2)) {
				break;
		}
		if (i > 81) {
			break;
		}
	}
	if (i > 81) return null;

	var length = cell.step + 1;
	cell = {x:x2, y:y2, step:length};
	steps = Array();
	while (cell.x != x1 || cell.y != y1) {
		if (cell.y != 0 && search_field[cell.x][cell.y - 1] == cell.step - 1) {
			cell = {x:cell.x, y:cell.y - 1, step:cell.step - 1};
			steps.push("d");
		} else
			if (cell.y != 8 && search_field[cell.x][cell.y + 1] == cell.step - 1) {
				cell = {x:cell.x, y:cell.y + 1, step:cell.step - 1};
				steps.push("u");
			} else
				if (cell.x != 0 && search_field[cell.x - 1][cell.y] == cell.step - 1) {
					cell = {x:cell.x - 1, y:cell.y, step:cell.step - 1};
					steps.push("r");
				} else
					if (cell.x != 8 && search_field[cell.x + 1][cell.y] == cell.step - 1) {
						cell = {x:cell.x + 1, y:cell.y, step:cell.step - 1};
						steps.push("l");
					}
	}
	return steps;
}

// gets 3 random spaces.
function getRandom()
{
	var res = Array();
	if (forRandom.length > 0) {
		for (var i = 0; i < 3 && forRandom.length; i++) {
			var num = Math.round(Math.random() * (forRandom.length - 1));
			res.push(forRandom[num]);
			for (var j = num; j < forRandom.length - 1; j++) {
				forRandom[j] = forRandom[j + 1];
			}
			forRandom.pop();
		}
	}
	return res;
}

// chooses the next 3 colors of ball
function forecast()
{
	for (var i = 1; i < 4; i++) {
		var num = (Math.round(Math.random() * 5) + 1);
		document.getElementById("ball-" + i).className = "ball" + num;
	}
}

// replaces an entry for (oldx,oldy) to (newx,newy)
function replaceRandom(oldx, oldy, newx, newy)
{
	for (var j = 0; j < forRandom.length; j++) {
		if (forRandom[j].x == oldx && forRandom[j].y == oldy) {
			forRandom[j].x = newx;
			forRandom[j].y = newy;
			return true;
		}
	}
}

// drops the balls of the forecasted colors in up to 3 spots.
function dropBalls()
{
	var nums = getRandom(); // get 3 random spots
	var loosed = true;
	for (var i = 0; i < nums.length; i++) {
		field[nums[i].x][nums[i].y] = document.getElementById("ball-" + (i + 1)).className.substring(4) * 1; // set the number in `field` to the correct color
		document.getElementById("cell-" + nums[i].x + "-" + nums[i].y).className = document.getElementById("ball-" + (i + 1)).className; // update display
		if (checktheBall(nums[i].x, nums[i].y)) loosed = false; // if this ball can be removed then we're not stuck yet
	}
	if (!forRandom.length && loosed) loose(); // if we're out of space and there's no balls to remove, we've lost
	forecast(); // pick next 3 colors
}

// function for losing. (interestingly contains code to reset the game)
function loose()
{
	alert("Game over");
	// for (var i = 0; i < 9; i++) {
	// 	for (var j = 0; j < 9; j++) {
	// 		field[i][j] = 0;
	// 		var cell = document.getElementById("cell-" + i + "-" + j);
	// 		cell.className = "";
	// 	}
	// }
	// search_field = [];
	// forRandom = [];
	// selected = null;
	// moving = false;
	// removing = false;
	// start = null;
	// score = 0;
}

// checks whether or not the ball at (x,y) can cause a score, and if so, calculates which balls can be removed. TODO: document more
function checktheBall(x, y)
{
	var v = Array();
	var h = Array();
	var y1 = Array();
	var y2 = Array();
	var t1 = true;
	var t2 = true;
	var t3 = true;
	var t4 = true;
	var t5 = true;
	var t6 = true;
	var t7 = true;
	var t8 = true;
	var cur = field[x][y];
	if (cur == 0) return false;
	var i = 0;
	while (t1 || t2 || t3 || t4 || t5 || t6 || t7 || t8) {
		i++;
		if (x - i >= 0 && y - i >= 0 && field[x - i][y - i] == cur && t1) {
			y2.push({x:x - i, y:y - i});
		} else {
			t1 = false;
		}

		if (y - i >= 0 && field[x][y - i] == cur && t2) {
			v.push({x:x, y:y - i});
		} else {
			t2 = false;
		}

		if (x + i < 9 && y - i >= 0 && field[x + i][y - i] == cur && t3) {
			y1.push({x:x + i, y:y - i});
		} else {
			t3 = false;
		}

		if (x - i >= 0 && y + i < 9 && field[x - i][y + i] == cur && t4) {
			y1.push({x:x - i, y:y + i});
		} else {
			t4 = false;
		}

		if (y + i < 9 && field[x][y + i] == cur && t5) {
			v.push({x:x, y:y + i});
		} else {
			t5 = false;
		}

		if (x + i < 9 && y + i >= 0 && field[x + i][y + i] == cur && t6) {
			y2.push({x:x + i, y:y + i});
		} else {
			t6 = false;
		}

		if (x - i >= 0 && field[x - i][y] == cur && t7) {
			h.push({x:x - i, y:y});
		} else {
			t7 = false;
		}

		if (x + i < 9 && field[x + i][y] == cur && t8) {
			h.push({x:x + i, y:y});
		} else {
			t8 = false;
		}
	}
	var res = false;
	if (v.length > 3 || h.length > 3 || y1.length > 3 || y2.length > 3) {
		removing = Array({x:x, y:y});
		res = true;
	}
	if (v.length > 3) {
		for (i = 0; i < v.length; i++) {
			removing.push(v[i]);
		}
	}
	if (h.length > 3) {
		for (i = 0; i < h.length; i++) {
			removing.push(h[i]);
		}
	}
	if (y1.length > 3) {
		for (i = 0; i < y1.length; i++) {
			removing.push(y1[i]);
		}
	}
	if (y2.length > 3) {
		for (i = 0; i < y2.length; i++) {
			removing.push(y2[i]);
		}
	}
	return res;
}

// create a cookie
function createCookie(name, value, days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		var expires = "; expires=" + date.toGMTString();
	}
	else expires = "";
	document.cookie = name + "=" + value + expires + "; path=/";
}

// read a cookie
function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for (var i=0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}
