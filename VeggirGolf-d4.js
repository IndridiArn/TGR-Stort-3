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
var maze;
var collisionFlag = true;
var xCollisionHorizontal = [];
var zCollisionHorizontal = [];
var prevX;
var prevZ;

var xCollisionVertical = [];
var zCollisionVertical = [];

var numVertices  = 6;

var program;

var pointsArray = [];
var texCoordsArray = [];

var texture;
var texVegg;
var texGolf;
var texLoft;

// Breytur fyrir hreyfingu áhorfanda
var userXPos = 0.0;                // Initial position of user
var userZPos = 5.0;                //   in (x, z) coordinates, y is fixed
var userIncr = 0.1;                // Size of forward/backward step
var userAngle = 270.0;             // Direction of the user in degrees
var userXDir = 0.0;                // X-coordinate of heading
var userZDir = -1.0;               // Z-coordinate of heading


var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var proLoc;
var mvLoc;

var vertices = [
// Hnútar veggsins
    vec4( -0.75,  0.0, 0.0, 1.0 ),
    vec4(  0.75,  0.0, 0.0, 1.0 ),
    vec4(  0.75,  1.0, 0.0, 1.0 ),
    vec4(  0.75,  1.0, 0.0, 1.0 ),
    vec4( -0.75,  1.0, 0.0, 1.0 ),
    vec4( -0.75,  0.0, 0.0, 1.0 ),
// Hnútar gólfsins (strax á eftir)
    vec4( -5.0,  0.0, 10.0, 1.0 ),
    vec4(  5.0,  0.0, 10.0, 1.0 ),
    vec4(  5.0,  0.0,  0.0, 1.0 ),
    vec4(  5.0,  0.0,  0.0, 1.0 ),
    vec4( -5.0,  0.0,  0.0, 1.0 ),
    vec4( -5.0,  0.0, 10.0, 1.0 )
];

// Mynsturhnit fyrir vegg
var texCoords = [
    vec2(  0.0, 0.0 ),
    vec2( 1.5, 0.0 ),
    vec2( 1.5, 1.0 ),
    vec2( 1.5, 1.0 ),
    vec2(  0.0, 1.0 ),
    vec2(  0.0, 0.0 ),
// Mynsturhnit fyrir gólf
    vec2(  0.0,  0.0 ),
    vec2( 10.0,  0.0 ),
    vec2( 10.0, 10.0 ),
    vec2( 10.0, 10.0 ),
    vec2(  0.0, 10.0 ),
    vec2(  0.0,  0.0 )
];

function readTextFile(file)
{
    var allText;
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                allText = rawFile.responseText;
            }
        }
    }
    rawFile.send(null);
    return allText;
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    maze = readTextFile("maze.txt");
    console.log(maze);  
    console.log(maze.length);
    //maze = maze.replace(/(\r\n\t|\n|\r\t)/gm,"");
    //console.log(maze);
    //console.log(maze[9]);
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    // Lesa inn og skilgreina mynstur fyrir vegg
    var veggImage = document.getElementById("VeggImage");
    texVegg = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texVegg );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, veggImage );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    // Lesa inn og skilgreina mynstur fyrir gólf
    var golfImage = document.getElementById("GolfImage");
    texGolf = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texGolf );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, golfImage );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    
    // Lesa inn og skilgreina mynstur fyrir loft
    var loftImage = document.getElementById("LoftImage");
    texLoft = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texLoft );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, loftImage );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);


    proLoc = gl.getUniformLocation( program, "projection" );
    mvLoc = gl.getUniformLocation( program, "modelview" );

    var proj = perspective( 50.0, 1.0, 0.2, 100.0 );
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));
    

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.clientX;
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
            userAngle += 0.4*(origX - e.clientX);
            userAngle %= 360.0;
            userXDir = Math.cos( radians(userAngle) );
            userZDir = Math.sin( radians(userAngle) );
            origX = e.clientX;
        }
    } );
    
    // Event listener for keyboard
     window.addEventListener("keydown", function(e){
         switch( e.keyCode ) {
            case 87:	// w
                prevX = userXPos;
                prevZ = userZPos;
                if(!checkCollisionX(userXPos, userZPos) && !checkCollisionZ(userXPos, userZPos)){
                    userXPos += userIncr * userXDir;
                    userZPos += userIncr * userZDir;
                }
                if(checkCollisionX(userXPos, userZPos))
                    userXPos = prevX
                if(checkCollisionZ(userXPos, userZPos))
                    userZPos = prevZ

                console.log("Xpos: " + userXPos);
                console.log("Zpos: " + userZPos);
                break;
            case 83:	// s
                prevX = userXPos;
                prevZ = userZPos;
                if(!checkCollisionX(userXPos, userZPos) && !checkCollisionZ(userXPos, userZPos)){
                    userXPos -= userIncr * userXDir;
                    userZPos -= userIncr * userZDir;
                }
                if(checkCollisionX(userXPos, userZPos))
                    userXPos = prevX
                if(checkCollisionZ(userXPos, userZPos))
                    userZPos = prevZ
                console.log("Xpos: " + userXPos);
                console.log("Zpos: " + userZPos);
                break;
            case 65:	// a
                prevX = userXPos;
                prevZ = userZPos;
                if(!checkCollisionX(userXPos, userZPos) && !checkCollisionZ(userXPos, userZPos)){
                    userXPos += userIncr * userZDir;
                    userZPos -= userIncr * userXDir;
                }
                if(checkCollisionX(userXPos, userZPos))
                    userXPos = prevX
                if(checkCollisionZ(userXPos, userZPos))
                    userZPos = prevZ
                console.log("Xpos: " + userXPos);
                console.log("Zpos: " + userZPos);
                break;
            case 68:	// d
                prevX = userXPos;
                prevZ = userZPos;
                if(!checkCollisionX(userXPos, userZPos) && !checkCollisionZ(userXPos, userZPos)){
                    userXPos -= userIncr * userZDir;
                    userZPos += userIncr * userXDir;
                }
                if(checkCollisionX(userXPos, userZPos))
                    userXPos = prevX
                if(checkCollisionZ(userXPos, userZPos))
                    userZPos = prevZ
                console.log("Xpos: " + userXPos);
                console.log("Zpos: " + userZPos);
                console.log(xCollisionHorizontal);
                break;
         }
     }  );  

    render();
 
}

function checkCollisionX(x, z){

    for(var i = 0; i < xCollisionVertical.length; i = i+1){
        //console.log(xCollisionVertical[i])
        //console.log(Math.abs(x - xCollisionVertical[i]))
        //console.log(Math.abs(x - xCollisionVertical[i]))
        if( (Math.abs(x - xCollisionVertical[i]) < 0.3 && z < zCollisionVertical[i] + 0.75 && z > zCollisionVertical[i] - 0.75))
            return true;

    }

    return false;
}

function checkCollisionZ(x, z){

    for(var i = 0; i < zCollisionHorizontal.length; i = i+1){
        console.log(Math.abs(z - zCollisionHorizontal[i]))
        if( (Math.abs(z - zCollisionHorizontal[i]) < 0.3 && x < xCollisionHorizontal[i] + 0.75 && x > xCollisionHorizontal[i] - 0.75))
            return true;
    }

    return false;
}

function drawMaze(){

    var mv = lookAt( vec3(userXPos, 0.5, userZPos), vec3(userXPos+userXDir, 0.5, userZPos+userZDir), vec3(0.0, 1.0, 0.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    var mv1 = mv;

    var xOffset = -4.25;
    var yOffset = 0.0;

    for(var i = 0; i < 63; i = i+1){
        if(i === 18 || i === 36 || i === 54)
            yOffset = yOffset + 1.5;
        if(i % 9 === 0 && i > 1)
            xOffset = -4.25;

        if(maze[i] === "|"){
            mv = mv1;
            mv = mult( mv, translate( xOffset-0.75, 0.0, yOffset + 0.75) );
            mv = mult( mv, rotateY( -90.0 ) );
            gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
            gl.bindTexture( gl.TEXTURE_2D, texVegg );
            gl.drawArrays( gl.TRIANGLES, 0, numVertices );
             if(collisionFlag){
                zCollisionVertical.push(yOffset + 0.75);
                xCollisionVertical.push(xOffset - 0.75);
            }
            if(maze[i+1] != " ")
            xOffset = xOffset + 1.5;
           
        }
        if(maze[i] === "-"){
            mv = mv1;
            mv = mult( mv, translate( xOffset, 0.0, yOffset) );
            gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
            gl.bindTexture( gl.TEXTURE_2D, texVegg );
            gl.drawArrays( gl.TRIANGLES, 0, numVertices );
            if(collisionFlag){
                zCollisionHorizontal.push(yOffset);
                xCollisionHorizontal.push(xOffset);
            }
            xOffset = xOffset + 1.5;
        }
        if(maze[i] === " "){
            if(maze[i+1] === " ")
                xOffset = xOffset + 0.75; 
            else
                xOffset = xOffset + 1.5;
        }

    }
    if(collisionFlag) collisionFlag = false;
}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // staðsetja áhorfanda og meðhöndla músarhreyfingu
    var mv = lookAt( vec3(userXPos, 0.5, userZPos), vec3(userXPos+userXDir, 0.5, userZPos+userZDir), vec3(0.0, 1.0, 0.0 ) );
    
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    var mv1 = mv;

    // Teikna gólf með mynstri
    gl.bindTexture( gl.TEXTURE_2D, texGolf );
    gl.drawArrays( gl.TRIANGLES, numVertices, numVertices );

    // Teikna loft með mynstri
    gl.bindTexture( gl.TEXTURE_2D, texLoft );
    mv = mult( mv, translate( 0.0, 1.0, 0.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLES, numVertices, numVertices );

    drawMaze();

    requestAnimFrame(render);
}
