var canvas;
var gl;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute

var translationLocation;
var resolutionLocation;
var rotationLocation;

var triangleData;
var circleData;
var rectData;

var boardBorder = [];
var centralCircle = [];

var goties = [];
var strikerData;

var holes = [];

var isStrikerMoving = false;
var releaseAngle = 0;
var velocity;
var power = 8.0;

var mouse_circle;
var mouse_rect_1;
var mouse_rect_2;

var points = 0;
function start() {
	canvas = document.getElementById('canvas');
	canvas.WIDTH = 800;
	canvas.HEIGHT = 800;

	initWebGL();
	initShader();
	initCanvas();
	
	initShapes();

	addEventListeners();
	
	//drawTriangle(shapeBuffers);
	setInterval(main, 15);
}

function addEventListeners() {
	canvas.addEventListener("mousedown", mouseDown, false);
	canvas.addEventListener("mouseup", mouseUp, false);
	canvas.addEventListener("mouseout", mouseUp, false);
	canvas.addEventListener("mousemove", mouseMove, false);
}

function moveStrikerLeft() {
	strikerData.x -= 5.0;
	strikerData[3][0] -= 5.0;
}

function moveStrikerRight() {
	strikerData.x += 5.0;
	strikerData[3][0] += 5.0;
}

function releaseStriker() {
	isStrikerMoving = true;
	if (releaseAngle >= 0) {
		velocity.x = (power * Math.cos(releaseAngle));
		velocity.y = -(power * Math.sin(releaseAngle));
	} else {
		velocity.x = -(power * Math.cos(releaseAngle));
		velocity.y = (power * Math.sin(releaseAngle));
	}
}

document.onkeydown = function(e) {
	e = e || window.event;
    switch(e.keyCode) {
        case 37: // left
        moveStrikerLeft();
        break;

        case 38: // up
        console.log("up");
        break;

        case 39: // right
        moveStrikerRight();
        break;

        case 40: // down
        console.log("down");
        break;

        case 13:
        releaseStriker();
        console.log("enter");
        break;

        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
};


function mouseDown() {
	console.log("down");
}

function mouseUp() {
	console.log("up");
}

function mouseOut() {
	console.log("out");
}

function mouseMove(event) {
	var rect = canvas.getBoundingClientRect();
	var mouse_x = event.clientX - rect.x; 
	var mouse_y = event.clientY - rect.y;
	mouse_circle[3][0] += (mouse_x - mouse_circle[3][0] - 400);
	mouse_circle[3][1] += (mouse_y - mouse_circle[3][1] - 400);

	mouse_rect_1[2][0] += (mouse_x - mouse_rect_1[2][0] - 425);
	mouse_rect_1[2][1] += (mouse_y - mouse_rect_1[2][1] - 400);

	mouse_rect_2[2][0] += (mouse_x - mouse_rect_2[2][0] - 400);
	mouse_rect_2[2][1] += (mouse_y - mouse_rect_2[2][1] - 425);
	//console.log(mouse_x, mouse_y);
	if (!isStrikerMoving) {
		var x_diff = mouse_x - strikerData.x ;
		var y_diff = mouse_y - strikerData.y ;
		releaseAngle = -Math.atan(y_diff/x_diff);
	}
	//console.log(releaseAngle * (180/Math.PI));
}


function randomInt(range) {
	return Math.floor(Math.random() * range);
}

function initWebGL() {
	gl = null;
	try {
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	} catch(e) {
		alert("WebGL is not supported in your browser");
	}

	if (!gl) {
		alert("WebGL is not supported in your browser");	
	}
}

function initShader() {
	var fragmentShader = getShader("shader-fs");
	var vertexShader = getShader("shader-vs");

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, fragmentShader);
	gl.attachShader(shaderProgram, vertexShader);

	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert('Unable to initialize the shader program');
	}

	vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "a_position"); 
	gl.enableVertexAttribArray(vertexPositionAttribute);

	vertexColorAttribute = gl.getAttribLocation(shaderProgram, "a_color");
	gl.enableVertexAttribArray(vertexColorAttribute);

	gl.useProgram(shaderProgram);
}

function getShader(id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		return null;
	}

	var theSource = "";
	var currentChild = shaderScript.firstChild;

	while(currentChild) {
		if (currentChild.nodeType == 3) {
			// text node
			theSource += currentChild.textContent;
		}
		currentChild = currentChild.nextSibling;
	}

	var shader;
	if (shaderScript.type == 'x-shader/x-fragment') {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == 'x-shader/x-vertex') {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		// unknown shader
		return null;
	}

	gl.shaderSource(shader, theSource);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert('An error occured while compiling the shader: '
			+ gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

function initCanvas() {
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	gl.viewport(0.0, 0.0, canvas.WIDTH, canvas.HEIGHT);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	translationLocation = gl.getUniformLocation(shaderProgram, "u_translation");
	gl.uniform3fv(translationLocation, [0, 0, 0]);

	resolutionLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
	gl.uniform3f(resolutionLocation, canvas.WIDTH, canvas.HEIGHT, 100);

	rotationLocation = gl.getUniformLocation(shaderProgram, "u_rotation");
}

function initTriangle(x, y, z, l, h) {
  	var vertices = [
		x, y, z,
		x + l, y, z,
		x + l, y + h, z
	];
	
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
		gl.STATIC_DRAW);

	//var colorLocation = gl.getUniformLocation(shaderProgram, "u_color");
	//gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);
	
	var colour = [
		0, 0, 1, 1,
		0, 0, 1, 1,
		0, 0, 1, 1,
		0, 0, 1, 1
	];

	var colourBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colour), gl.STATIC_DRAW);

	return [vertexBuffer, colourBuffer];
}

function drawTriangle(shapeBuffers) {
	vertexBuffer = shapeBuffers[0];
	colourBuffer = shapeBuffers[1];

	var translation = shapeBuffers.translation;
	gl.uniform3fv(translationLocation, translation);	

	// drawing
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	//gl.drawArrays(gl.TRIANGLES, 3, 3);*/
}

function initCircle(x, y, z, radius, num_triangle, isColor = 0) {
	var vertices = [];
	var colours = [];
	var angle = (2 * Math.PI)/num_triangle;
	var vertex;
	var base_colour = [
		247/255,231/255,205/255, 1,
		247/255,231/255,205/255, 1,
		247/255,231/255,205/255, 1
	];
	var colour = [
		126/255, 24/255, 17/255, 1,
		126/255, 24/255, 17/255, 1,
		126/255, 24/255, 17/255, 1
	];

	var black_goti = [
		114/255, 102/255, 106/255, 1,
		114/255, 102/255, 106/255, 1,
		114/255, 102/255, 106/255, 1,
		114/255, 102/255, 106/255, 1
	];

	var white_goti = [
		254/255, 199/255, 161/255, 1,
		254/255, 199/255, 161/255, 1,
		254/255, 199/255, 161/255, 1,
		254/255, 199/255, 161/255, 1
	];

	var queen_goti = [
		231/255, 22/255, 57/255, 1,
		231/255, 22/255, 57/255, 1,
		231/255, 22/255, 57/255, 1,
		231/255, 22/255, 57/255, 1
	];

	var striker = [
		0, 109/255, 102/255, 1,
		0, 109/255, 102/255, 1,
		0, 109/255, 102/255, 1,
		0, 109/255, 102/255, 1
	];

	var hole_color = [
		80/255 ,4/255, 11/255, 1,
		80/255 ,4/255, 11/255, 1,
		80/255 ,4/255, 11/255, 1,
		80/255 ,4/255, 11/255, 1
	];

	var pointer = [
		0, 51/255, 238/255, 1,
		0, 51/255, 238/255, 1,
		0, 51/255, 238/255, 1
	];

	for (var i=1; i<=num_triangle; i++) {
		vertex = [
			x, y, z,
			x + (radius * Math.cos(angle * (i-1))), y + (radius * Math.sin(angle * (i-1))), z,
			x + (radius * Math.cos(angle * i)), y + (radius * Math.sin(angle * i)), z
		];

		vertices = vertices.concat(vertex);
		if (isColor == 0)
			colours = colours.concat(base_colour);
		else if (isColor == 1)
			colours = colours.concat(colour);
		else if (isColor == 2)
			colours = colours.concat(black_goti);
		else if (isColor == 3)
			colours = colours.concat(white_goti);
		else if (isColor == 4)
			colours = colours.concat(queen_goti);
		else if (isColor == 5)
			colours = colours.concat(striker);
		else if (isColor == 6)
			colours = colours.concat(hole_color);
		else if (isColor == 7)
			colours = colours.concat(pointer);
	}
	
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	var colourBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colours), gl.STATIC_DRAW);

	return [vertexBuffer, colourBuffer, num_triangle];
}

function drawCircle(shapeBuffers) {
	vertexBuffer = shapeBuffers[0];
	colourBuffer = shapeBuffers[1];
	num_triangle = shapeBuffers[2];
	var translation = shapeBuffers[3];

	gl.uniform3fv(translationLocation, translation);	

	// drawing
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	
	gl.drawArrays(gl.TRIANGLES, 0, num_triangle*3);
}

function initRect(x, y, z, l, b) {
	var vertices = [
		x, y, z,
		x + l, y, z,
		x, y + b, z,

		x + l, y + b, z,
		x + l, y, z,
		x, y + b, z
	];
	
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
		gl.STATIC_DRAW);

	//var colorLocation = gl.getUniformLocation(shaderProgram, "u_color");
	//gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);
	
	var colour = [
		115/255,65/255,42/255, 1,
		115/255,65/255,42/255, 1,
		115/255,65/255,42/255, 1,
		115/255,65/255,42/255, 1,
		115/255,65/255,42/255, 1,
		115/255,65/255,42/255, 1
	];

	var colourBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colour), gl.STATIC_DRAW);

	return [vertexBuffer, colourBuffer];	
}

function drawRect(shapeBuffers) {
	vertexBuffer = shapeBuffers[0];
	colourBuffer = shapeBuffers[1];
	var translation = shapeBuffers[2];

	gl.uniform3fv(translationLocation, translation);	

	// drawing
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function initShapes() {
	/*triangleData = initTriangle(0, 0, 0, 100, 100);
	triangleData.translation = [0, 0, 0];

	circleData = initCircle(400, 400, 0, 50, 360);
	circleData.translation = [0, 0, 0];

	rectData = initRect(0, 0, 0, 800, 40);
	rectData.translation = [0, 0, 0];*/

	makeBoardBorder();
	makeCentralCircle();
	makeGotis();
	makeStriker();
	makeHoles();
	makePointer();
}

function makePointer() {
	mouse_circle = initCircle(400, 400, 0, 10, 180, 7);
	mouse_circle[3] = [0, 0, 0];

	mouse_rect_1 = initRect(400, 400, 0, 50, 2);
	mouse_rect_1[2] = [-25, 0, 0];

	mouse_rect_2 = initRect(400, 400, 0, 2, 50);
	mouse_rect_2[2] = [0, -25, 0];
}

function drawPointer() {
	drawCircle(mouse_circle);
	drawRect(mouse_rect_1);
	drawRect(mouse_rect_2);
}

function makeBoardBorder() {
	var rectangle = initRect(0, 0, 0, 800, 40);
	rectangle[2] = [0, 0, 0];
	boardBorder.push(rectangle);

	rectangle = initRect(0, 760, 0, 800, 40);
	rectangle[2] = [0, 0, 0];
	boardBorder.push(rectangle);

	rectangle = initRect(760, 0, 0, 40, 800);
	rectangle[2] = [0, 0, 0];
	boardBorder.push(rectangle);

	rectangle = initRect(0, 0, 0, 40, 800);
	rectangle[2] = [0, 0, 0];
	boardBorder.push(rectangle);
}

function makeCentralCircle() {
	var circle = initCircle(400, 400, 0, 80, 360,1);
	circle[3] = [0, 0, 0];
	centralCircle.push(circle);

	circle = initCircle(400, 400, 0, 78, 360);
	circle[3] = [0, 0, 0];
	centralCircle.push(circle);
}

function drawCentralCircle() {
	for (var i=0; i<2; i++)
		drawCircle(centralCircle[i]);
}

function drawBoardBorder() {
	for (var i=0; i<4; i++)
		drawRect(boardBorder[i]);
}

function makeGotis() {
	var root_two = 1.414;
	// black goti
	var circle = initCircle(400, 400, 0, 20, 360,2);
	circle[3] = [0, -60, 0];
	circle.x = 400 + circle[3][0];
	circle.y = 400 + circle[3][1];
	circle.vel_x = 0;
	circle.vel_y = 0;
	goties.push(circle);

	circle = initCircle(400, 400, 0, 20, 360,2);
	circle[3] = [0, 60, 0];
	circle.x = 400 + circle[3][0];
	circle.y = 400 + circle[3][1];
	circle.vel_x = 0;
	circle.vel_y = 0;
	goties.push(circle);

	circle = initCircle(400, 400, 0, 20, 360,2);
	circle[3] = [60, 0, 0];
	circle.x = 400 + circle[3][0];
	circle.y = 400 + circle[3][1];
	circle.vel_x = 0;
	circle.vel_y = 0;
	goties.push(circle);

	circle = initCircle(400, 400, 0, 20, 360,2);
	circle[3] = [-60, 0, 0];
	circle.x = 400 + circle[3][0];
	circle.y = 400 + circle[3][1];
	circle.vel_x = 0;
	circle.vel_y = 0;
	goties.push(circle);

	// white goti
	circle = initCircle(400, 400, 0, 20, 360,3);
	circle[3] = [30*root_two, 30*root_two, 0];
	circle.x = 400 + circle[3][0];
	circle.y = 400 + circle[3][1];
	circle.vel_x = 0;
	circle.vel_y = 0;
	goties.push(circle);

	circle = initCircle(400, 400, 0, 20, 360,3);
	circle[3] = [-30*root_two, 30*root_two, 0];
	circle.x = 400 + circle[3][0];
	circle.y = 400 + circle[3][1];
	circle.vel_x = 0;
	circle.vel_y = 0;
	goties.push(circle);

	circle = initCircle(400, 400, 0, 20, 360,3);
	circle[3] = [-30*root_two, -30*root_two, 0];
	circle.x = 400 + circle[3][0];
	circle.y = 400 + circle[3][1];
	circle.vel_x = 0;
	circle.vel_y = 0;
	goties.push(circle);

	circle = initCircle(400, 400, 0, 20, 360,3);
	circle[3] = [30*root_two, -30*root_two, 0];
	circle.x = 400 + circle[3][0];
	circle.y = 400 + circle[3][1];
	circle.vel_x = 0;
	circle.vel_y = 0;
	goties.push(circle);

	// queen
	circle = initCircle(400, 400, 0, 20, 360,4);
	circle[3] = [0, 0, 0];
	circle.x = 400 + circle[3][0];
	circle.y = 400 + circle[3][1];
	circle.vel_x = 0;
	circle.vel_y = 0;
	goties.push(circle);
}

function makeStriker() {
	// striker
	strikerData = initCircle(400, 400, 0, 25, 360,5);
	strikerData[3] = [0, 280, 0];
	strikerData.x = 400;
	strikerData.y = 680;
	velocity = new Object();
	velocity.x = 10;
	velocity.y = 10;
}

function drawStriker() {
	drawCircle(strikerData);
}

function drawGotis() {
	for (var i=0; i<goties.length; i++)
		drawCircle(goties[i]);
}

function resetStriker() {
	strikerData[3] = [0, 280, 0];
	strikerData.x = 400;
	strikerData.y = 680;
	velocity = new Object();
	velocity.x = 10;
	velocity.y = 10;
	isStrikerMoving = false;
}

function moveStriker() {
	strikerData.x += velocity.x;
	strikerData.y += velocity.y;
	
	strikerData[3][0] += velocity.x;
	strikerData[3][1] += velocity.y;
}

function checkBorderCollision() {
	var x = strikerData.x;
	var y = strikerData.y;
	if (x >= 750) {
		velocity.x = -(velocity.x);
	} else if ( x <= 50) {
		velocity.x = -(velocity.x);
	} else if ( y >= 750) {
		velocity.y = -(velocity.y);
	} else if ( y <= 50) {
		velocity.y = -(velocity.y);
	}

	for (var i=0; i<goties.length; i++) {
		x = goties[i].x;
		y = goties[i].y;
		if (x >= 750) {
			goties[i].vel_x = -(goties[i].vel_x);
		} else if ( x <= 50) {
			goties[i].vel_x = -(goties[i].vel_x);
		} else if ( y >= 750) {
			goties[i].vel_y = -(goties[i].vel_y);
		} else if ( y <= 50) {
			console.log("yes");
			goties[i].vel_y = -(goties[i].vel_y);
		}	
	}
}

function checkCollisionWithGotis() {
	var distance;
	var x1, y1, x2, y2;
	var vx, vy;
	var v, velo;
	for (var i=0; i<goties.length; i++) {
		distance = (strikerData.x - goties[i].x) * (strikerData.x - goties[i].x)
			+ (strikerData.y - goties[i].y) * (strikerData.y - goties[i].y);

		if (distance <= 2025) {
			vx = goties[i].vel_x;
			vy = goties[i].vel_y;
			/*vx = (goties[i].vel_x + velocity.x)/2;
			vy = (goties[i].vel_y + velocity.y)/2;
			v = vx*vx + vy*vy;
			velo = velocity.x * velocity.x + velocity.y * velocity.y;
			if (v > velo) {
				e = 2/3;
			} else {
				e = 1/3;
			}*/

			goties[i].vel_x = velocity.x;
			goties[i].vel_y = velocity.y;
			
			velocity.x = vx;
			velocity.y = vy;
		}
	}
	for (var i=0; i<goties.length; i++) {
		x1 = goties[i].x;
		y1 = goties[i].y;
		for (var j=0; j<goties.length; j++) {
			x2 = goties[j].x;
			y2 = goties[j].y;
			distance = (x1 - x2) * (x1 - x2)
				+ (y1 - y2) * (y1 - y2);

			if (distance <= 2000) {
				vx = goties[i].vel_x;
				vy = goties[i].vel_y;
				
				goties[i].vel_x = goties[j].vel_x;
				goties[i].vel_y = goties[j].vel_y;
				
				goties[j].vel_x = vx;
				goties[j].vel_y = vy;
			}
		}
	}
}

function moveGoties() {
	for (var i=0; i<goties.length; i++) {
		goties[i].x += goties[i].vel_x;
		goties[i].y += goties[i].vel_y;
	
		goties[i][3][0] += goties[i].vel_x;
		goties[i][3][1] += goties[i].vel_y;
	}	
}

function doesFall() {
	var distance;
	var x1, y1, x2, y2;
	for (var i=0; i<goties.length; i++) {
		x1 = goties[i].x;
		y1 = goties[i].y;
		for (var j=0; j<4; j++) {
			x2 = holes[j].x;
			y2 = holes[j].y;
			distance = (x1- x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);

			if (distance <= 2500) {
				goties.splice(i, 1);
				console.log("goal");
				points += 10;
				resetStriker();
			}
		}
	}
}

function makeHoles() {
	var hole = initCircle(400, 400, 0, 30, 360,6);
	hole[3] = [-320, -320, 0];
	hole.x = 400 + hole[3][0];
	hole.y = 400 + hole[3][1];
	holes.push(hole);

	hole = initCircle(400, 400, 0, 30, 360,6);
	hole[3] = [320, 320, 0];
	hole.x = 400 + hole[3][0];
	hole.y = 400 + hole[3][1];
	holes.push(hole);

	hole = initCircle(400, 400, 0, 30, 360,6);
	hole[3] = [-320, 320, 0];
	hole.x = 400 + hole[3][0];
	hole.y = 400 + hole[3][1];
	holes.push(hole);

	hole = initCircle(400, 400, 0, 30, 360,6);
	hole[3] = [320, -320, 0];
	hole.x = 400 + hole[3][0];
	hole.y = 400 + hole[3][1];
	holes.push(hole);
}

function drawHoles() {
	for (var i=0; i<4; i++)
		drawCircle(holes[i]);
}

function main() {
	if (isStrikerMoving)
		moveStriker();
	draw();
	checkBorderCollision();
	checkCollisionWithGotis();
	moveGoties();
	doesFall();

	if (goties.length == 0) {
		console.log("Points: " + points);
	}
}
function draw() {
	drawBoardBorder();
	drawHoles();
	drawCentralCircle();
	drawGotis();
	drawStriker();
	drawPointer();
}