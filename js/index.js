   'use strict';
   var gParticles = [];
   var gStep = 50;

   var Particle = function() {
     this.pos = createVector(random(width), random(height));
     this.vel = p5.Vector.random2D().mult(0.1 * random());
     this.acc = createVector();
     this.update = function() {
       this.vel.add(this.acc);
       this.vel.limit(4);
       this.pos.add(this.vel);
       if (this.pos.x < 0) {
         this.pos.x = width;
       } else {
         if (this.pos.x > width) {
           this.pos.x = 0;
         }
       }
       if (this.pos.y < 0) {
         this.pos.y = height;
       } else {
         if (this.pos.y > height) {
           this.pos.y = 0;
         }
       }
       this.acc.mult(0);
     }
     this.show = function() {
       fill(gOpts.particleColor);
       noStroke();
       rect(this.pos.x, this.pos.y, 2, 2);
     }
   }

   var Options = function() {
     this.animSpeed = 0.001;
     this.change = 0.04;
     this.drawForces = false;
     this.numParticles= 3000;
     this.lineColor = [255, 255, 255];
     this.particleColor = [255,105,0,20];
     this.reseed = function() {
       reseed();
     };
     this.restart = restart;
   }
   var gOpts; //params model shared between gui and simulation.

   function setup() {
     //createCanvas(200, 200); //windowWidth, windowHeight);
     frameRate(60);
     createCanvas(windowWidth, windowHeight);
     gOpts = new Options();
     var gui = new dat.GUI();
     gui.addColor(gOpts, 'lineColor');
     gui.addColor(gOpts, 'particleColor');
     gui.add(gOpts, 'animSpeed', 0, 0.003);
     gui.add(gOpts, 'change', 0.00001, 0.1);
     gui.add(gOpts, 'numParticles', 1, 4000);
     gui.add(gOpts, 'reseed');
     gui.add(gOpts, 'restart');
     gui.add(gOpts, 'drawForces');
     restart();
   }

   function mousePressed() {
   }

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
     stroke(gOpts.lineColor);
     var halfStep = step / 2;
     translate(x + halfStep, y + halfStep);
     rotate(angleForNoiseValue(val));
     line(0, 0, step / 4, step / 4);
     rect(step / 4, step / 4, 2, 2);
     pop();
   }

   var gForces = [];

   function draw() {
     background(color(0, 0, 30, 1));

     fill(0, 0, 255);
     var change = gOpts.change;
     var animSpeed = gOpts.animSpeed;
     gForces = [];
     for (var col = 0; col < width / gStep; col += 1) {
       for (var row = 0; row < height / gStep; row += 1) {
         var x = col * gStep;
         var y = row * gStep;
         var n = noise(animSpeed * frameCount + change * col, animSpeed * frameCount + change * row);
         gForces[col + width * row] = n;
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

     //noLoop();
   }

   function applyNearestForceToParticle(p) {
     var gridX = floor(p.pos.x / gStep);
     var gridY = floor(p.pos.y / gStep);
     var ix = gridX + width * gridY;

     var nearestForce = gForces[ix];

     // console.log("ix: "+ ix +", gridX,gridY: "+[gridX, gridY]+"near: "+nearestForce + " gforcessize: " + gForces.length);
     var angle = angleForNoiseValue(nearestForce);
     var angleVec = p5.Vector.fromAngle(angle);
     p.acc.add(angleVec.mult(0.51));
   }