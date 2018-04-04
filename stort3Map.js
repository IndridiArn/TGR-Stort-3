/////////////////////////////////////////////////////////////////
//    Sýnislausn á dæmi 4 í heimadæmum 6 í Tölvugrafík
//     Forrit með þremur mynstrum.  Sýnir herbergi með fjórum
//     veggjum, gólfi og lofti, hvert með sínu mynstrinu.  Það
//     er hægt að ganga um herbergið, en það er engin árekstarvörn.
//
//    Hjálmtýr Hafsteinsson, mars 2018
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numVertices = 6;

var program;

var pointsArray = [];
var texCoordsArray = [];

var texture;
var texVegg;
var texGolf;
var texLoft;

// Breytur fyrir hreyfingu áhorfanda
var userXPos = -1.50; // Initial position of user
var userZPos = 6; //   in (x, z) coordinates, y is fixed
var userIncr = 0.1; // Size of forward/backward step
var userAngle = 270.0; // Direction of the user in degrees
var userXDir = 0.0; // X-coordinate of heading
var userZDir = -1.0; // Z-coordinate of heading


var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var proLoc;
var mvLoc;

// Hnútar veggsins
var smallWall = [
    vec4(-5.0, 0.0, 0.0, 1.0),
    vec4(-2.0, 0.0, 0.0, 1.0),
    vec4(-2.0, 1.0, 0.0, 1.0),
    vec4(-2.0, 1.0, 0.0, 1.0),
    vec4(-5.0, 1.0, 0.0, 1.0),
    vec4(-5.0, 0.0, 0.0, 1.0)

];

var smallwallCoords = [
    vec2(0.0, 0.0),
    vec2(10.0, 0.0),
    vec2(10.0, 1.0),
    vec2(10.0, 1.0),
    vec2(0.0, 1.0),
    vec2(0.0, 0.0)
];
var vertices = [
    vec4(-5.0, 0.0, 0.0, 1.0),
    vec4(5.0, 0.0, 0.0, 1.0),
    vec4(5.0, 1.0, 0.0, 1.0),
    vec4(5.0, 1.0, 0.0, 1.0),
    vec4(-5.0, 1.0, 0.0, 1.0),
    vec4(-5.0, 0.0, 0.0, 1.0),
    // Hnútar gólfsins (strax á eftir)
    vec4(-50.0, 0.0, 20.0, 1.0),
    vec4(50.0, 0.0, 20.0, 1.0),
    vec4(50.0, 0.0, -20.0, 1.0),
    vec4(50.0, 0.0, -20.0, 1.0),
    vec4(-50.0, 0.0, -20.0, 1.0),
    vec4(-50.0, 0.0, 20.0, 1.0),
    // minni veggir

];

// Mynsturhnit fyrir vegg
var texCoords = [
    vec2(0.0, 0.0),
    vec2(10.0, 0.0),
    vec2(10.0, 1.0),
    vec2(10.0, 1.0),
    vec2(0.0, 1.0),
    vec2(0.0, 0.0),
    // Mynsturhnit fyrir gólf
    vec2(0.0, 0.0),
    vec2(100.0, 0.0),
    vec2(100.0, 40.0),
    vec2(100.0, 40.0),
    vec2(0.0, 40.0),
    vec2(0.0, 0.0),
    //minni veggir

];


window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);


    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    // Lesa inn og skilgreina mynstur fyrir vegg
    var veggImage = document.getElementById("VeggImage");
    texVegg = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texVegg);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, veggImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);


    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);



    //gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    // Lesa inn og skilgreina mynstur fyrir gólf
    var golfImage = document.getElementById("GolfImage");
    texGolf = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texGolf);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, golfImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Lesa inn og skilgreina mynstur fyrir loft
    var loftImage = document.getElementById("LoftImage");
    texLoft = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texLoft);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, loftImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    
    var smallVeggImage = document.getElementById("VeggImage");
    smalltexVegg = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, smalltexVegg);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, smallVeggImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    

    proLoc = gl.getUniformLocation(program, "projection");
    mvLoc = gl.getUniformLocation(program, "modelview");

    var proj = perspective(50.0, 1.0, 0.2, 100.0);
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));


    //event listeners for mouse
    canvas.addEventListener("mousedown", function (e) {
        movement = true;
        origX = e.clientX;
    });

    canvas.addEventListener("mouseup", function (e) {
        movement = false;
    });

    canvas.addEventListener("mousemove", function (e) {
        if (movement) {
            userAngle += 0.4 * (origX - e.clientX);
            userAngle %= 360.0;
            userXDir = Math.cos(radians(userAngle));
            userZDir = Math.sin(radians(userAngle));
            origX = e.clientX;
        }
    });

    // Event listener for keyboard
    window.addEventListener("keydown", function (e) {
        switch (e.keyCode) {

            case 87: // w
                userXPos += userIncr * userXDir;
                userZPos += userIncr * userZDir;;
                break;
            case 83: // s
                userXPos -= userIncr * userXDir;
                userZPos -= userIncr * userZDir;;
                break;
            case 65: // a
                userXPos += userIncr * userZDir;
                userZPos -= userIncr * userXDir;;
                break;
            case 68: // d
                userXPos -= userIncr * userZDir;
                userZPos += userIncr * userXDir;;
                break;
        }
        console.log(userXPos, userZPos);
        //console.log(userZPos);
    });

    render();

}

var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // staðsetja áhorfanda og meðhöndla músarhreyfingu
    var mv = lookAt(vec3(userXPos, 0.5, userZPos), vec3(userXPos + userXDir, 0.5, userZPos + userZDir), vec3(0.0, 1.0, 0.0));

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    var mv1 = mv;

    // Teikna gólf með mynstri
    gl.bindTexture(gl.TEXTURE_2D, texGolf);
    gl.drawArrays(gl.TRIANGLES, numVertices, numVertices);

    // Teikna loft með mynstri
    gl.bindTexture(gl.TEXTURE_2D, texLoft);
    var s = scalem(100,1,1)
    mv = mult(mv, translate(0.0, 1.0, 0.0));
    mv = mult(mv,s);
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, numVertices, numVertices);

    // Teikna framvegg með mynstri
    mv = mv1;
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.bindTexture(gl.TEXTURE_2D, texVegg);
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Teikna bakvegg með mynstri
    mv = mult(mv, translate(0.0, 0.0, 10.0));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Teikna hliðarvegg með mynstri
    mv = mv1;
    mv = mult(mv, translate(5.0, 0.0, 5.0));
    mv = mult(mv, rotateY(90.0));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Teikna hliðarvegg með mynstri
    mv = mv1;
    mv = mult(mv, translate(-5.0, 0.0, 4.0));
    mv = mult(mv, rotateY(-90.0));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);


    // Hér byrjar aukagumsið

    mv = mv1;
    mv = mult(mv, translate(-7.0, 0.0, 10.0));
    //mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv = mv1;
    mv = mult(mv, translate(-11.0, 0.0, 10.0));
    //mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);


    mv = mv1;
    mv = mult(mv, translate(-12.0, 0.0, 10.0));
    //mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv = mv1;
    mv = mult(mv, translate(-15.0, 0.0, 10.0));
    //mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // Hér byrjar aukagumsið

    mv = mv1;
    mv = mult(mv, translate(-7.0, 0.0, 9.0));
    //mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv = mv1;
    mv = mult(mv, translate(-12.0, 0.0, 4.0));
    mv = mult(mv, rotateY(-90.0));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv = mv1;
    mv = mult(mv, translate(-13.0, 0.0, 4.0));
    mv = mult(mv, rotateY(-90.0));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);


    mv = mv1;
    mv = mult(mv, translate(-18.0, 0.0, 9.0));
    //mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);


    //gl.bindTexture(gl.TEXTURE_2D, smalltexVegg);
    //gl.drawArrays(gl.TRIANGLES, numVertices, numVertices);



    mv = mv1;
    //gl.bindTexture(gl.TEXTURE_2D, smalltexVegg);
    var s = scalem(0.3,1,0.3)
    mv = mult(mv, translate(-10.50, 0.0, -1.0));
    mv = mult(mv,s);
    //mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);


    mv = mv1;
    //gl.bindTexture(gl.TEXTURE_2D, smalltexVegg);
    var s = scalem(0.6,1,0.3)
    mv = mult(mv, translate(-10.50, 0.0, -2.0));
    mv = mult(mv,s);
    //mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);


    
    mv = mv1;
    //gl.bindTexture(gl.TEXTURE_2D, smalltexVegg);
    var s = scalem(0.1,1,0.3)
    mv = mult(mv, translate(-9.50, 0.0, -1.0));
    mv = mult(mv,s);
    mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);


    mv = mv1;
    //gl.bindTexture(gl.TEXTURE_2D, smalltexVegg);
    var sl = scalem(1,1,0.37)
    mv = mult(mv, translate(-13.0, 0.0, -2.8));
    mv = mult(mv,sl);
    mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    

    mv = mv1;
    var sl = scalem(1,1,0.8)
    mv = mult(mv, translate(-22.0, 0.0, 13.0));
    mv = mult(mv,sl);
    mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);


    mv = mv1;
    var sl = scalem(0.8,1,0.6)
    mv = mult(mv, translate(-20.50, 0.0, 13.60));
    mv = mult(mv,sl);
    mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv = mv1;
    var sl = scalem(0.5,1,1)
    mv = mult(mv, translate(-24.50, 0.0, 17.0));
    mv = mult(mv,sl);
    //mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);


    mv = mv1;
    var sl = scalem(0.5,1,1)
    mv = mult(mv, translate(-24.50, 0.0, 17.0));
    mv = mult(mv,sl);
    //mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv = mv1;
    var sl = scalem(0.9,1,1)
    mv = mult(mv, translate(-23.50, 0.0, 18.50));
    mv = mult(mv,sl);
    //mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv = mv1;
    var sl = scalem(1,1,0.5)
    mv = mult(mv, translate(-28.0, 0.0, 17.0));
    mv = mult(mv,sl);
    mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv = mv1;
    var sl = scalem(1,1,0.3)
    mv = mult(mv, translate(-27.0, 0.0, 15.5));
    mv = mult(mv,sl);
    mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv = mv1;
    var sl = scalem(0.3,1,1)
    mv = mult(mv, translate(-27.5, 0.0, 14.5));
    mv = mult(mv,sl);
    //mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv = mv1;
    var sl = scalem(0.4,1,0.6)
    mv = mult(mv, translate(-18.50, 0.0, 16.60));
    mv = mult(mv,sl);
    //mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv = mv1;
    var sl = scalem(1,1,0.6)
    mv = mult(mv, translate(-16.5, 0.0, 19.00));
    mv = mult(mv,sl);
    mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv = mv1;
    var sl = scalem(0.5,1,1)
    mv = mult(mv, translate(-19.0, 0.0, 22.00));
    mv = mult(mv,sl);
    //mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    mv = mv1;
    var sl = scalem(1,1,0.5)
    mv = mult(mv, translate(-19.0, 0.0, 21.00));
    mv = mult(mv,sl);
    mv = mult( mv, rotateY( -90.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices)


    requestAnimFrame(render);
}