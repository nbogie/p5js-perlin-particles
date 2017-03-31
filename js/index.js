   'use strict';
   var gParticles = [];
   var gStep = 50;
   var gNumCols = 10;
   var gNumRows = 10;


  //TODO: have the particles gradually exhaust themselves, delay, 
  //and relaunch.

   var Particle = function() {
     this.pos = createVector(random(width), random(height));
     this.prevPos = this.pos.copy();
     this.vel = p5.Vector.random2D().mult(0.1 * random());
     this.acc = createVector();
     
     
     this.maxSpeedMod = random(0.9, 1.1);
     this.updatePrevX = function() {
       this.prevPos.x = this.pos.x;
     }
     this.updatePrevY = function() {
       this.prevPos.y = this.pos.y;
     }
     this.update = function() {
       this.updatePrevX();
       this.updatePrevY();
       

       this.vel.add(this.acc);
       this.vel.limit(this.maxSpeedMod * gOpts.maxSpeed);
       this.pos.add(this.vel);

       if (this.pos.x < 0) {
         this.pos.x = width;
         this.updatePrevX();
       } else {
         if (this.pos.x > width) {
           this.pos.x = 0;
           this.updatePrevX();
         }
       }
       if (this.pos.y < 0) {
         this.pos.y = height;
         this.updatePrevY();

       } else {
         if (this.pos.y > height) {
           this.pos.y = 0;
           this.updatePrevY();
         }
       }
       this.acc.mult(0);
     }
     
     this.show = function() {
       fill(gOpts.particleColor);
       if (gOpts.drawLines) {
         strokeWeight(0.1);
         stroke(gOpts.particleColor);
         line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);
       } else {
         noStroke();
         rect(this.pos.x, this.pos.y, 2, 2);
       }
     }
   }

   var Options = function() {
     this.animSpeed = 0.001;
     this.change = 0.04;
     this.drawForces = false;
      
    var profile = random([{ms: 9.0, s: 3.46, np: 1070}, {ms: 4.0, s: 0.51, np: 3000}]);
     this.maxSpeed = profile.ms;
     this.strength = profile.s;
     this.numParticles = profile.np;
     
     this.drawLines = true;
     var colorProfile = random([
       {bg: [0, 0, 30, 5], p: [255, 105, 0, 20]}, 
       {bg: [0, 0, 30, 1], p: [204, 248, 0, 20]}, 
       {bg: [0, 255, 45, 1], p: [255, 0, 255, 20]}, 
       {bg: [0, 0, 30, 1], p: [255, 105, 0, 20]}]);
     this.backgroundColor = colorProfile.bg;
     this.particleColor = colorProfile.p;
     this.forceColor = [255, 255, 255];     
     
     this.reseed = function() {
       reseed();
     };
     this.restart = restart;
   }
   var gOpts; //params model shared between gui and simulation.
   function nearestMult(n, x) {
     var rem = n % x;
     return n - rem;
   }

   function setup() {
     //createCanvas(200, 200); //windowWidth, windowHeight);
     frameRate(60);
     createCanvas(nearestMult(windowWidth, gStep), nearestMult(windowHeight, gStep));
     gOpts = new Options();
     var gui = new dat.GUI();
     gui.addColor(gOpts, 'forceColor');
     gui.addColor(gOpts, 'backgroundColor');     
     gui.addColor(gOpts, 'particleColor');
     gui.add(gOpts, 'animSpeed', 0, 0.003);
     gui.add(gOpts, 'change', 0.00001, 0.1);
     gui.add(gOpts, 'maxSpeed', 0.1, 10);
     gui.add(gOpts, 'drawLines');
     gui.add(gOpts, 'numParticles', 1, 4000);
     gui.add(gOpts, 'strength', 0, 4);
     gui.add(gOpts, 'reseed');
     gui.add(gOpts, 'restart');
     gui.add(gOpts, 'drawForces');
     dat.GUI.toggleHide();
     restart();
   }

   function mousePressed() {}

   function restart() {
     reseed();
     gParticles = [];
     for (var i = 0; i < gOpts.numParticles; i++) {
       gParticles.push(new Particle());
     }

   }

   function reseed() {
     noiseSeed(100000000 * random());
   }

   function angleForNoiseValue(val) {
     return 4 * val * TWO_PI;
   }

   function drawAngle(x, y, step, val) {
     fill(200 - 100 * val);
     noStroke();
     rect(x, y, step, step);
     push();
     strokeWeight(1);
     stroke(gOpts.forceColor);
     var halfStep = step / 2;
     translate(x + halfStep, y + halfStep);
     rotate(angleForNoiseValue(val));
     line(0, 0, step / 4, step / 4);
     rect(step / 4, step / 4, 2, 2);
     pop();
   }

   var gForces = [];

   function draw() {
     background(gOpts.backgroundColor);

     fill(0, 0, 255);
     var change = gOpts.change;
     var animSpeed = gOpts.animSpeed;
     gForces = [];
     gNumCols = floor(width / gStep);
     gNumRows = floor(height / gStep);

     for (var col = 0; col < gNumCols; col++) {
       for (var row = 0; row < gNumRows; row++) {

         var x = col * gStep;
         var y = row * gStep;
         var n = noise(animSpeed * frameCount + change * col,
           animSpeed * frameCount + change * row);
         gForces[col + gNumCols * row] = n;
         if (gOpts.drawForces) {
           drawAngle(x, y, gStep, n);
         }
       }
     }

     gParticles.forEach(function(p) {
       applyNearestForceToParticle(p);
       p.update();
       p.show();
     });
   }

   function applyNearestForceToParticle(p) {
     var gridX = floor(p.pos.x / gStep);
     var gridY = floor(p.pos.y / gStep);
     var ix = gridX + floor(width / gStep) * gridY;

     var nearestForce = gForces[ix];
     var angle = angleForNoiseValue(nearestForce);
     var angleVec = p5.Vector.fromAngle(angle);
     p.acc.add(angleVec.mult(gOpts.strength));
   }