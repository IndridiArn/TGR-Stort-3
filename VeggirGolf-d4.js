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
var throughWall = false;
var throughWallUse = 1;
var minoRandomUse = 1;
var exitX;
var exitZ;
var randNum;
var minoRandX = [-4.1, 13, 16.5, 19.5, -4.5, 19.5];
var minoRandZ = [3.5, 6.8, 12.7,  3.7, 2.3, 1.45];
var randMino;
var playing = false;

var minoX;
var minoZ;
var minoDirX = 0.015;
var minoDirZ = 0.015;

var minutes = 0;
var seconds = 0;
var millis = 0;


var xCollisionVertical = [];
var zCollisionVertical = [];

var numVertices = 6;

var program;

var pointsArray = [];
var texCoordsArray = [];

var texture;
var texVegg;
var texGolf;
var texLoft;

// Breytur fyrir hreyfingu áhorfanda
var userXPos = 7.7;                // Initial position of user
var userZPos = 19.0;                //   in (x, z) coordinates, y is fixed
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
    vec4( -5.0,  0.0, 20.0, 1.0 ),
    vec4(  20.5,  0.0, 20.0, 1.0 ),
    vec4(  20.5,  0.0,  0.0, 1.0 ),
    vec4(  20.5,  0.0,  0.0, 1.0 ),
    vec4( -5.0,  0.0,  0.0, 1.0 ),
    vec4( -5.0,  0.0, 20.0, 1.0 )
];

// Mynsturhnit fyrir vegg
var texCoords = [
    vec2(  0.0, 0.0 ),
    vec2( 1.0, 0.0 ),
    vec2( 1.0, 1.0 ),
    vec2( 1.0, 1.0 ),
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
    randNum = (Math.floor(Math.random()*5)+1);

    randMino = (Math.floor(Math.random()*5));
    minoX = minoRandX[randMino];
    minoZ = minoRandZ[randMino];

    //minoX = userXPos - 2;
    //minoZ = userZPos - 4;

    console.log(randNum);
    if(randNum === 1){
        exitX = 19.5;
        exitZ = 1.45;
    }

    if(randNum === 2){
        exitX = 7.6;
        exitZ = 1.45;
    }

    if(randNum === 3){
        exitX = -4.4;
        exitZ = 1.45;
    }

    if(randNum === 4){
        exitX = 16.6;
        exitZ = 1.45;
    }

    if(randNum === 5){
        exitX = 7.7;
        exitZ = 1.45;
    }


    maze = readTextFile("maze" + randNum  + ".txt");
    console.log(maze);
    
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

    // Lesa inn og skilgreina mynstur fyrir Mínótárus
    var minoImage = document.getElementById("MinoImage");
    texMino = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texMino );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, minoImage );
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

    render();
 
}

//initKeyboardHandlers();
var g_keys = [];

// When a key is pressed
function handleKeydown() {

        // W
    if (g_keys[87]) {
      playing = true;
      prevX = userXPos;
      prevZ = userZPos;
      if(!checkCollisionX(userXPos, userZPos) && !checkCollisionZ(userXPos, userZPos)){
          userXPos += (userIncr * userXDir)/4;
          userZPos += (userIncr * userZDir)/4;
      }
      if(checkCollisionX(userXPos, userZPos))
          userXPos = prevX
      if(checkCollisionZ(userXPos, userZPos))
          userZPos = prevZ
    }
    // A
    if (g_keys[65]) {
      userAngle -= 1;
      userAngle %= 360.0;
      userXDir = Math.cos( radians(userAngle) );
      userZDir = Math.sin( radians(userAngle) );
    }
    // S
    if (g_keys[83]) {
      playing = true;
      prevX = userXPos;
      prevZ = userZPos;
      if(!checkCollisionX(userXPos, userZPos) && !checkCollisionZ(userXPos, userZPos)){
          userXPos -= (userIncr * userXDir)/4;
          userZPos -= (userIncr * userZDir)/4;
      }
      if(checkCollisionX(userXPos, userZPos))
          userXPos = prevX
      if(checkCollisionZ(userXPos, userZPos))
          userZPos = prevZ
    }
    // D
    if (g_keys[68]) {
      userAngle += 1;
      userAngle %= 360.0;
      userXDir = Math.cos( radians(userAngle) );
      userZDir = Math.sin( radians(userAngle) );
    }
    
    // Q
    if (g_keys[81]) {
      playing = true;
      prevX = userXPos;
      prevZ = userZPos;
      if(!checkCollisionX(userXPos, userZPos) && !checkCollisionZ(userXPos, userZPos)){
          userXPos += (userIncr * userZDir)/4;
          userZPos -= (userIncr * userXDir)/4;
      }
      if(checkCollisionX(userXPos, userZPos))
          userXPos = prevX
      if(checkCollisionZ(userXPos, userZPos))
          userZPos = prevZ
    }
  // E
    if (g_keys[69]) {
      playing = true;
      prevX = userXPos;
      prevZ = userZPos;
      if(!checkCollisionX(userXPos, userZPos) && !checkCollisionZ(userXPos, userZPos)){
          userXPos -= (userIncr * userZDir)/4;
          userZPos += (userIncr * userXDir)/4;
      }
      if(checkCollisionX(userXPos, userZPos))
          userXPos = prevX
      if(checkCollisionZ(userXPos, userZPos))
          userZPos = prevZ      
    }
    // F
    if (g_keys[70]) {
      if(throughWallUse > 0){
          throughWall = true;
          throughWallUse = 0;
          document.getElementById("ThroughWall").innerHTML = "Í gegnum vegg: 0";
      }
    }
    // R
    if (g_keys[82]) {
      reset();
    }
    // C
    if (g_keys[67]) {
      minoRandom();
      document.getElementById("MinoRandom").innerHTML = "Rugla Mínótárus: 0";
    }
    setTimeout(handleKeydown, 10);
}

// When the key is released
function handleKeyup(evt) {
  g_keys[evt.keyCode] = false;
}
 
window.addEventListener('keydown',function(e){
    g_keys[e.keyCode] = true;
},true);    
window.addEventListener('keyup',function(e){
    g_keys[e.keyCode] = false;
},true);

handleKeydown();

function checkCollisionX(x, z){

    for(var i = 0; i < xCollisionVertical.length; i = i+1){
        if( (Math.abs(x - xCollisionVertical[i]) < 0.3 && z < zCollisionVertical[i] + 0.75 && z > zCollisionVertical[i] - 0.75)){
            if(throughWall === false)
                return true;
            else 
                setTimeout(function(){ throughWall = false }, 1500);
    }

    }

    return false;
}

function checkCollisionZ(x, z){

    for(var i = 0; i < zCollisionHorizontal.length; i = i+1){
        if((Math.abs(z - zCollisionHorizontal[i]) < 0.3 && x < xCollisionHorizontal[i] + 0.75 && x > xCollisionHorizontal[i] - 0.75)){
            if(throughWall === false)
                return true;
            else 
                setTimeout(function(){ throughWall = false }, 750);
    }
    }

    return false;
}

function minoMove(){
    // ef það er nóg pláss í x átt þá x += 1, ef það er nóg pláss í z átt þá z += 1.
    var prevMinoX = minoX;
    var prevMinoZ = minoZ;
    minoX += minoDirX;
    minoZ += minoDirZ;

    for(var i = 0; i < zCollisionHorizontal.length; i = i+1){
        if((Math.abs(minoZ - zCollisionHorizontal[i]) < 0.3 && minoX < xCollisionHorizontal[i] + 0.75 && minoX > xCollisionHorizontal[i] - 0.75)){
            minoZ = prevMinoZ;
            minoDirZ *= -1;
    }
    }

    for(var i = 0; i < xCollisionVertical.length; i = i+1){
        if( (Math.abs(minoX - xCollisionVertical[i]) < 0.3 && minoZ < zCollisionVertical[i] + 0.75 && minoZ > zCollisionVertical[i] - 0.75)){
            minoX = prevMinoX;
            minoDirX *= -1;
    }

    }

}

function drawMino(){

    var mv = lookAt( vec3(userXPos, 0.5, userZPos), vec3(userXPos+userXDir, 0.5, userZPos+userZDir), vec3(0.0, 1.0, 0.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    var mv1 = mv;

    mv = mv1;
    mv = mult( mv, translate( minoX, 0.0, minoZ-0.3) );
    mv = mult( mv, scalem( 0.4, 0.7, 0.7) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.bindTexture( gl.TEXTURE_2D, texMino );
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    mv = mv1;
    mv = mult( mv, translate( minoX, 0.0, minoZ+0.3) );
    mv = mult( mv, scalem( 0.4, 0.7, 0.7) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.bindTexture( gl.TEXTURE_2D, texMino );
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    mv = mv1;
    mv = mult( mv, translate( minoX+0.3, 0.0, minoZ) );
    mv = mult( mv, rotateY( -90.0 ) );
    mv = mult( mv, scalem( 0.4, 0.7, 0.7) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.bindTexture( gl.TEXTURE_2D, texMino );
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    mv = mv1;
    mv = mult( mv, translate( minoX-0.3, 0.0, minoZ) );
    mv = mult( mv, rotateY( -90.0 ) );
    mv = mult( mv, scalem( 0.4, 0.7, 0.7) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.bindTexture( gl.TEXTURE_2D, texMino );
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

}

function drawMaze(){

    var mv = lookAt( vec3(userXPos, 0.5, userZPos), vec3(userXPos+userXDir, 0.5, userZPos+userZDir), vec3(0.0, 1.0, 0.0 ) );
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    var mv1 = mv;

    var xOffset = -4.25;
    var yOffset = 0.0;


    for(var i = 0; i < maze.length; i = i+1){
        if(i % 70 === 0)
            yOffset = yOffset + 1.5;
        if(i % 35 === 0 && i > 1)
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

function add() {
    millis++;
    if (millis >= 100) {
        millis = 0;
        seconds++;
        if (seconds >= 60) {
            seconds = 0;
            minutes++;
        }
    }
    timer();
}
function timer() {
    t = setTimeout(add, 10);
}

timer();

function minoRandom() {
    if(minoRandomUse > 0){
        randMino = (Math.floor(Math.random()*5));
        minoX = minoRandX[randMino];
        minoZ = minoRandZ[randMino];

        minoRandomUse -= 1;
    }    
}

function reset(){
        playing = false;
        userXPos = 7.7;
        userZPos = 19;
        g_keys[65] = false;
        g_keys[68] = false;
        g_keys[67] = false;
        g_keys[69] = false;
        g_keys[81] = false;
        g_keys[83] = false;
        g_keys[87] = false;
        g_keys[82] = false;
        var temp = randNum;

        // Svo við fáum ekki sama völundarhús aftur.
        while(randNum === temp)
            randNum = (Math.floor(Math.random()*5)+1);

        maze = readTextFile("maze" + randNum  + ".txt");
        throughWallUse = 1;
        minoRandomUse = 1;
        collisionFlag = true;
        xCollisionHorizontal = [];
        zCollisionHorizontal = [];
        xCollisionVertical = [];
        zCollisionVertical = [];
        minutes = 0;
        seconds = 0;
        millis = 0;
        randMino = (Math.floor(Math.random()*5));
        minoX = minoRandX[randMino];
        minoZ = minoRandZ[randMino];

}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // staðsetja áhorfanda og meðhöndla músarhreyfingu
    var mv = lookAt( vec3(userXPos, 0.5, userZPos), vec3(userXPos+userXDir, 0.5, userZPos+userZDir), vec3(0.0, 1.0, 0.0 ) );
    document.getElementById("DistToEnd").innerHTML = "Fjarlægð til útgangs: " + Math.trunc( Math.sqrt( Math.pow((userXPos-exitX), 2) + Math.pow((userZPos - exitZ), 2) ) ) + " metrar";
    document.getElementById("PlayerCoords").innerHTML = "Fjarlægð frá Mínótárus: " + Math.trunc(Math.sqrt( Math.pow((userXPos-minoX), 2) + Math.pow((userZPos - minoZ), 2))) + " metrar";
    document.getElementById("Timer").innerHTML = "Tími: " + minutes + ":" + seconds + ":" + millis;
    
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
    drawMino();

    minoMove();

    if(userZPos < 1.5){
        alert("Þú lifðir! Þú komst út á tímanum " + minutes + ":" + seconds + ":" + millis + ".")
        reset();
    }

    if( Math.trunc(Math.sqrt( Math.pow((userXPos-minoX), 2) + Math.pow((userZPos - minoZ), 2))) < 1.0 ) {
        alert("Mínótárus náði þér! Þú varst " + Math.trunc( Math.sqrt( Math.pow((userXPos-exitX), 2) + Math.pow((userZPos - exitZ), 2) ) ) + " metrum frá útgangnum.")
        reset();

    }

    requestAnimFrame(render);
}
