var canvas;
var gl;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute

var translationLocation;

var triangleData;

function start() {
	canvas = document.getElementById('canvas');
	canvas.WIDTH = 800;
	canvas.HEIGHT = 800;

	initWebGL();
	initShader();
	initCanvas();
	
	var shapeBuffers;
	var x = randomInt(800)
	var y = randomInt(800);
	var z = randomInt(80);
	
	triangleData = initTriangle(x, y, z,40, 50);
	initShapes();
	
	//drawTriangle(shapeBuffers);
	setInterval(main, 15);
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
}

function initShapes(argument) {
	triangleData.translation = [0, 0, 0];	
}

function initTriangle(x, y, z, l, h) {
	var vertices = [
		x, y, z,
		x+l, y, z, 
		x+l, y+h, z
	]
	var resolutionLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
	gl.uniform3f(resolutionLocation, canvas.WIDTH, canvas.HEIGHT, 100);
	
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
		gl.STATIC_DRAW);

	//var colorLocation = gl.getUniformLocation(shaderProgram, "u_color");
	//gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);
	
	var colour = [
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

	var translation = triangleData.translation;
	gl.uniform3fv(translationLocation, translation);	

	// drawing
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
}

function main() {

	if (triangleData.translation[0] < 100) {
		triangleData.translation[0] += 1.0;
		triangleData.translation[1] += 1.0;
	} else {
		triangleData.translation[0] = -100;
		triangleData.translation[1] = -100;
	}

	draw();
}
function  draw() {
	drawTriangle(triangleData);
}