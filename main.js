var canvas;
var gl;
var squareVerticesBuffer;
var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var perspectiveMatrix;


function start() {
	canvas = document.getElementById("glcanvas");
	initWebGL(canvas);

	if (gl) {
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);

		initShaders();

		initBuffers();

		setInterval(drawScene, 15);					
	}
}
function initShaders() {
	var fragmentShader = getShader(gl, "shader-fs");
	var vertexShader = getShader(gl, "shader-vs");

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Unable to initialize the shader program");
	}

	gl.useProgram(shaderProgram);

	vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(vertexPositionAttribute);
}

function getShader(gl, id) {
	var shaderScript, theSource, currentChild, shader;
	shaderScript = document.getElementById(id);

	if (!shaderScript) {
		return null;
	}

	theSource = "";
	currentChild = shaderScript.firstChild;

	while(currentChild) {
		if (currentChild.nodeType == 3) { // currentChild.TEXT_NODE
			theSource += currentChild.textContent;
		}

		currentChild = currentChild.nextSibling;
	}

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
		alert("An error occured compiling the shaders: " + gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

function initWebGL(canvas) {
	gl = null;

	try {
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	} catch(e) {
		// Nothing
		//console.log("Can't get WebGL context");
	}

	// If we don't have a GL context, give up now
	if (!gl) {
		alert("Unable to initialize WebGL. Your browser may not support it.");
	}
}

var horizAspect = 480.0/640.0;

function initBuffers() {
	squareVerticesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

	var vertices = [
		1.0, 1.0, 0.0,
		-1.0, 1.0, 0.0,
		1.0, -1.0, 0.0,
		-1.0, -1.0, 0.0
	];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

function drawScene() {
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

	perspectiveMatrix =  makePerspective(45, 640.0/480.0, 0.1, 100.0);

	loadIdentity();
	mvTranslate([0.0, 0.0, -6.0]);

	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

