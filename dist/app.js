"use strict";
let gl;
let timeLoc = 0;
let aspectRatioLoc = 0;
let startTime = 0;
window.onload = function () {
    // Create canvas and WegGl context
    const canvas = createCanvas(document);
    gl = createWebGl2RenderingContext(canvas);
    // Create program + shaders
    const vertexShader = createVertexShader(gl);
    const fragmentShader = createFragmentShader(gl);
    const program = createProgram(gl, [vertexShader, fragmentShader]);
    gl.useProgram(program);
    // Get and store location of program uniforms/attributes
    const positionLoc = gl.getAttribLocation(program, "position");
    timeLoc = gl.getUniformLocation(program, "time");
    aspectRatioLoc = gl.getUniformLocation(program, "aspectRatio");
    // setup a quad convering the entire canvas,
    // this will create data for the fragment shader, 
    // without this there would be nothing to draw and the fragment shader would not be used
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    // map position attribute to buffer data
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, // size (num components)
    gl.FLOAT, // type of data in buffer
    false, // normalize
    0, // stride (0 = auto)
    0);
    startTime = Date.now();
    render();
};
function render() {
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // Clear screen
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Pass data to uniforms
    gl.uniform1f(timeLoc, (Date.now() - startTime) / 1000.);
    gl.uniform1f(aspectRatioLoc, gl.canvas.width / gl.canvas.height);
    // do the actual drawing
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    window.requestAnimationFrame(render);
}
function createCanvas(document) {
    var canvas = document.createElement('canvas');
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    document.body.appendChild(canvas);
    return canvas;
}
function createWebGl2RenderingContext(canvas) {
    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
    if (gl)
        return gl;
    throw new Error("WebGL2 not supported");
}
function createVertexShader(gl) {
    const source = `#version 300 es
        
        in vec4 position;
        out vec2 vTextureCoord;

        void main() {
            gl_Position = position;
            vTextureCoord = vec2(position.xy);
        }`;
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, source);
    return vertexShader;
}
function createFragmentShader(gl) {
    const source = `#version 300 es
            precision highp float;
            
            in vec2 vTextureCoord;
            out vec4 outputColor;

            uniform float time;
            uniform float aspectRatio;

            #define ZOOM_LENGTH 8.0

            float mandelbrot(vec2 p) 
            {
                int iterations = 0;
                int max = 1000;
                vec2 c = vec2(p.x, p.y);
                
                for (int i = 0; i < 1000; i++)
                {
                    p = vec2(p.x*p.x - p.y*p.y, 2.*p.x*p.y) + c;
                    if (length(p) > 2.0)
                        break;

                    iterations++;
                }

                // Normalize to 0. -> 1.
                return iterations == max ? 0.0 : float(iterations) / float(max);
            }

            void main(void) {
                vec2 uv = vTextureCoord;
                uv.x *= aspectRatio;
                
                // calculate zoom
                float fzoom = 0.65 + 0.38*cos(time/ZOOM_LENGTH);
                float zoom = pow(fzoom, ZOOM_LENGTH) * 1.0;
                
                vec2 center = vec2(-.737611,.18651);
                uv *= zoom;
                uv += center;
                
                float c = mandelbrot(uv);
                
                vec3 color = vec3(c); 
                color.x = c*9.;
                color.y = c*3.;
                color.z = c*1.;
                
                outputColor = vec4(color, 1.0);
            }
        `;
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, source);
    return fragmentShader;
}
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success)
        return shader;
    const errorDetails = gl.getShaderInfoLog(shader);
    throw new Error(errorDetails);
}
function createProgram(gl, shaders) {
    const program = gl.createProgram();
    for (let shader of shaders) {
        gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success)
        return program;
    const errorDetails = gl.getProgramInfoLog(program);
    throw new Error(errorDetails);
}
function resizeCanvasToDisplaySize(canvas) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    // Check if the canvas is not the same size.
    const needResize = canvas.width !== displayWidth ||
        canvas.height !== displayHeight;
    if (needResize) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
}
//# sourceMappingURL=app.js.map