var canvas;
var gl;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute

function start() {
	canvas = document.getElementById('canvas');
	canvas.WIDTH = 1024;
	canvas.HEIGHT = 768;

	initWebGL();
	initShader();
	var shapeBuffers = initTriangle();
	drawTriangle(shapeBuffers);
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

	vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "position"); 
	gl.enableVertexAttribArray(vertexPositionAttribute);

	//vertexColorAttribute = gl.getAttribLocation(shaderProgram, "color");
	//gl.enableVertexAttribArray(vertexColorAttribute);

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

function initTriangle() {
	var vertices = [
		0, 0,
		100, 100,
		100, 0
	]
	var resolutionLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
	gl.uniform2f(resolutionLocation, canvas.WIDTH, canvas.HEIGHT);
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
		gl.STATIC_DRAW);

	var colorLocation = gl.getUniformLocation(shaderProgram, "u_color");
	gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);
	var colour = [
		0, 0, 1,
		0, 1, 0,
		1, 0, 0
	];

	var colourBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colour),
		gl.STATIC_DRAW);

	return [vertexBuffer, colourBuffer];
}

function drawTriangle(shapeBuffers) {
	vertexBuffer = shapeBuffers[0];
	colourBuffer = shapeBuffers[1];

	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	console.log(canvas.WIDTH, canvas.HEIGHT);
	gl.viewport(0.0, 0.0, canvas.WIDTH, canvas.HEIGHT);
	gl.clear(gl.COLOR_BUFFER_BIT);
	// drawing
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 2,
		gl.FLOAT, false, 0, 0);
	
	//gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
	//gl.vertexAttribPointer(colourBuffer, 3, gl.FLOAT, false, 0, 0);
	//gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER)
	//gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
	//gl.flush();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
}