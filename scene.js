//aliases for box2d stuff. Makes life easier.
var b2Vec2 = Box2D.Common.Math.b2Vec2
, b2AABB = Box2D.Collision.b2AABB
, b2BodyDef = Box2D.Dynamics.b2BodyDef
, b2Body = Box2D.Dynamics.b2Body
, b2FixtureDef = Box2D.Dynamics.b2FixtureDef
, b2Fixture = Box2D.Dynamics.b2Fixture
, b2World = Box2D.Dynamics.b2World
, b2MassData = Box2D.Collision.Shapes.b2MassData
, b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
, b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
, b2DebugDraw = Box2D.Dynamics.b2DebugDraw
,  b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
;

var PIXELS_TO_WORLD = 30.0;
var PIXEL_SCALE = 1.0;

var score = 0;
var RESTITUTION = 0.5;
var FLUXUM_W = 30;
var FLUXUM_HALF_W = 15;

var playW = 1024;
var playH = 768;

var bucketLoc = { x: playW - 300, y: playH - 600 };
var bucketDim = { w: 200, h: 400 };

var fulcrumLoc = { x: (playW - 300) / 2, y: playH - 100};
var fulcrumDim = { w: 30, h: 30 };

var fieldDim = { w: 700, h: 500 };
var fieldLoc = { x: fulcrumLoc.x, y: fulcrumLoc.y - fieldDim.h/2 };

var maxFluxum = 32;
var nFluxum = 32;

var field = null;
var pins = [];

var titleY = -fieldDim.h/2-120;
var scoreY = -fieldDim.h/2-60;
var scoreY2 = -fieldDim.h/2-20;

const imgdir = "../images/";

var sceneCanvas = null;

var img = new Array();
var backgrounds = new Array();
var fluxum = new Array();
var boundaries = new Array();
var grabs = new Array();
var grabsBodies = new Array();

var grabbedIndex = -1;
var mouse_pressed = false;
var mouse_joint = null;

var eyesOpen = null;
var eyesClosed = null;
var dottedLines = null;

var world = null;
var silkscreenFont = null;


function Fluxum(world, id_, x_, y_, w_, h_, mass_){

    this.id = id_;
	this.x = x_;
	this.y = y_;
	this.mass = mass_;
	this.width = w_;    
	this.height = h_;
	this.world_radius = this.width / PIXELS_TO_WORLD;
	this.body = null;
    this.sprite = img[id_ % maxFluxum];

	var fixDef = new b2FixtureDef;
	fixDef.density = 1.0;
	fixDef.restitution = RESTITUTION;
	fixDef.friction = 1.0;

	var bodyDef = new b2BodyDef;
	bodyDef.position.x = this.x/PIXELS_TO_WORLD;
	bodyDef.position.y = this.y/PIXELS_TO_WORLD;
	bodyDef.type = b2Body.b2_dynamicBody;

	fixDef.shape = new b2CircleShape;
	fixDef.shape.SetRadius(this.width/(PIXELS_TO_WORLD), this.height/(PIXELS_TO_WORLD));

	this.body = world.CreateBody(bodyDef);
	this.body.CreateFixture(fixDef);
    
	//so that we can access element from box2d
	this.body.SetUserData(this);
	
	this.mouseInBounds = function() {
		var mx = mouseX / PIXELS_TO_WORLD;
		var my = mouseY / PIXELS_TO_WORLD;
		var x1 = this.body.GetPosition().x;
		var y1 = this.body.GetPosition().y;
		
	    //console.log ("x: " + (x1 - this.world_radius) + " < " + mx + " < " + (x1 + this.world_radius));
		//console.log ("y: " + (y1 - this.world_radius) + " < " + my + " < " + (y1 + this.world_radius));
		if ((mx < (x1 + this.world_radius)) &&
		    (mx > (x1 - this.world_radius)) &&
			(my < (y1 + this.world_radius)) &&
			(my > (y1 - this.world_radius))) {
				return true;
		} else {
			return false;
		}
	}
	
	this.tempo = 0;
	this.prevTempo = 0; 
	this.spinning = false;
    this.prevSpinning = false;
	
	this.updateAudioRate = function() {
        this.tempo = (this.body.GetAngularVelocity())*3;
        if (this.tempo != this.prevTempo) {
			//console.log("Set " + this.tempo);
            // set tempo
			//updateSlider(this.tempo, this.id);
        } 
		this.prevTempo = this.tempo;
        if (abs(this.tempo) > 0.015) {
			this.prevSpinning = this.spinning;
            this.spinning = true;
        } else {
			this.prevSpinning = this.spinning;
            this.spinning = false;
        }
	    if (!this.prevSpinning && this.spinning) {
	        // turn on
			//playSound(this.id);
			this.prevSpinning = true;
	    }
	    if (this.prevSpinning && !this.spinning) {
	        // turn off
			//stopSound(this.id);
			this.prevSpinning = false;
	    }
		//console.log("tempo " + this.tempo + " spinning " + this.spinning );
	}
}

function generatePinList() {
	let nPins = 125;
	for (i = 0; i < nPins; i++) {
		let _x = Math.random() * fieldDim.w / 2;
		let _y = Math.random() * fieldDim.h - fieldDim.h / 2;
		pins.push( { x: _x, y: _y } );
		pins.push( { x: -_x, y: _y } );
	}
}

function Field(world, x_, y_, w_, h_, mass_) {

	    this.x = x_;
		this.y = y_;
		this.mass = 100;
		this.width = w_;    
		this.height = h_;
		this.world_radius = this.width / PIXELS_TO_WORLD;
		this.body = null;

		var bodyDef = new b2BodyDef;
		bodyDef.position.x = this.x/PIXELS_TO_WORLD;
		bodyDef.position.y = this.y/PIXELS_TO_WORLD;
		bodyDef.type = b2Body.b2_dynamicBody;

		this.body = world.CreateBody(bodyDef);
		

		for (i = 0; i < pins.length; i++) {
			let fixDef = new b2FixtureDef;
			fixDef.density = 1.0;
			fixDef.restitution = 1.0;
			fixDef.friction = 1.0;
			fixDef.shape = new b2CircleShape;
			fixDef.shape.SetRadius(1 /PIXELS_TO_WORLD, 1 / PIXELS_TO_WORLD);
			fixDef.shape.SetLocalPosition(new b2Vec2(pins[i].x/PIXELS_TO_WORLD, pins[i].y/PIXELS_TO_WORLD ));
			this.body.CreateFixture(fixDef);
		}
		
		// Edges
		let fixDef = new b2FixtureDef;
		fixDef.density = 1.0;
		fixDef.restitution = RESTITUTION;
		fixDef.friction = 1.0;
	    
		fixDef.shape = new b2PolygonShape;
		fixDef.shape.SetAsEdge(new b2Vec2(-fieldDim.w/ PIXELS_TO_WORLD /2, -fieldDim.h/ PIXELS_TO_WORLD/2), 
		                       new b2Vec2(-fieldDim.w/ PIXELS_TO_WORLD /2, fieldDim.h/ PIXELS_TO_WORLD/2));
		this.body.CreateFixture(fixDef);
		
		fixDef.shape = new b2PolygonShape;
		fixDef.shape.SetAsEdge(new b2Vec2(fieldDim.w/ PIXELS_TO_WORLD /2, -fieldDim.h/ PIXELS_TO_WORLD/2), 
		                       new b2Vec2(fieldDim.w/ PIXELS_TO_WORLD /2, fieldDim.h/ PIXELS_TO_WORLD/2));
		
		this.body.CreateFixture(fixDef);
		
   		fixDef.shape = new b2PolygonShape;
   		console.log(fieldDim.w/ PIXELS_TO_WORLD /2);
   		fixDef.shape.SetAsEdge(new b2Vec2(-40/ PIXELS_TO_WORLD /2, fieldDim.h/ PIXELS_TO_WORLD/2), 
   		                       new b2Vec2(40/ PIXELS_TO_WORLD /2, fieldDim.h/ PIXELS_TO_WORLD/2));
												   
		this.body.CreateFixture(fixDef);
		
		//so that we can access element from box2d
		this.body.SetUserData(this);
		
}

function Boundary(world, x_, y_, w_, h_){

    this.x = x_;
	this.y = y_;
	this.width = w_;
	this.height = h_;
	this.body = null;
	this.bodyDef = new b2BodyDef;
	
	this.bodyDef.position.x = this.x/PIXELS_TO_WORLD;
	this.bodyDef.position.y = this.y/PIXELS_TO_WORLD;
	this.bodyDef.type = b2Body.b2_staticBody;
	
	this.body = world.CreateBody(this.bodyDef);
	
	var fixDef = new b2FixtureDef;
	fixDef.density = 1.0;
	fixDef.restitution = RESTITUTION;
	fixDef.friction = 1.0;
	
	fixDef.shape = new b2PolygonShape;
	fixDef.shape.SetAsBox(this.width/PIXELS_TO_WORLD, this.height/(PIXELS_TO_WORLD));
	this.body.CreateFixture(fixDef);
    
	//so that we can access element from box2d
	this.body.SetUserData(this);
}

Fluxum.prototype.renderAnimations = function(){
	noStroke();
	fill('rgba(0,0,0, 0.25)');
	var x = this.body.GetPosition().x;
	var y = this.body.GetPosition().y;
	push();
	translate(x * PIXELS_TO_WORLD, y * PIXELS_TO_WORLD);
	rotate((this.body.GetAngle()));
	//ellipse(0, 0, FLUXUM_W + 10, FLUXUM_W +10);
	rect(-1000, 0, 4000, 5);
	for (x = 0; x < 800; x += 10) {
		var r = (Math.random() * 100)-50;
		rect(x, 0, 5, r);
		rect(-x, 0, 5, r);
	}
	noFill();
	stroke(0);
	for (x = 10; x < 30; x++) {
		ellipse(0, 0, x * 15, x * 15);
	}
	pop();
}

Fluxum.prototype.render = function(){
	
	var x = this.body.GetPosition().x;
	var y = this.body.GetPosition().y;
	if (y > 22) {
		setScoreBasedOnX(x);
		this.body.SetPositionAndAngle(new b2Vec2(28, 0.1), 0);
	}
	push();
	translate(x * PIXELS_TO_WORLD, y * PIXELS_TO_WORLD);
	rotate((this.body.GetAngle()));
	this.updateAudioRate();
	image(this.sprite, -FLUXUM_HALF_W, -FLUXUM_HALF_W, FLUXUM_W, FLUXUM_W);
    if (this.spinning) {
   	    image(eyesOpen, -FLUXUM_HALF_W, -FLUXUM_HALF_W, FLUXUM_W, FLUXUM_W);
    } else {
    	image(eyesClosed, -FLUXUM_HALF_W, -FLUXUM_HALF_W, FLUXUM_W, FLUXUM_W);
    }

	pop();
}

Field.prototype.render = function(){
	
	var x = this.body.GetPosition().x;
	var y = this.body.GetPosition().y;
	push();
	textSize(74);
	strokeWeight(1);
	fill(200);
	stroke(200);
	translate(x * PIXELS_TO_WORLD, y * PIXELS_TO_WORLD);
	rotate((this.body.GetAngle()));
	//rect(x, y, fieldDim.w, fieldDim.h)
	text("FLUXLY ARCADE", -340, titleY);
	textSize(42);
	text("SCORE: " + score, -340, scoreY);
	textSize(24);
	//text("555 | 321 | 123 | 111 ", -340, scoreY2);
	fill(200);
	// pins
	for(i = 0; i < pins.length; i++){
			//ellipse(pins[i].x, pins[i].y, 2, 2);
			//ellipse(-pins[i].x, pins[i].y, 2, 2);
			rect(pins[i].x, pins[i].y, 3, 3);
			rect(-pins[i].x, pins[i].y, 3, 3);
	}
	pop();
}

function preload() {
	for (i = 0; i < maxFluxum; i++) {
		 img.push(loadImage(imgdir + 'mesh' + i + '.png'));
	 }
 	for (i = 0; i < 1; i++) {
 		 backgrounds.push(loadImage(imgdir + 'background' + i + '.png'));
 	 }
	 dottedLines = loadImage(imgdir + "dottedLines.png");
     eyesOpen = loadImage(imgdir + 'eyesOpen.png');
	 eyesClosed = loadImage(imgdir + 'eyesClosed.png');
	 silkscreenFont = loadFont('slkscr.ttf');
}


function init(world){

	//set boundaries
	textAlign(LEFT, CENTER);
	
	var fixDef = new b2FixtureDef;
	fixDef.density = 1.0;
	fixDef.restitution = RESTITUTION;
	fixDef.friction = 1.0;
	
	generatePinList();
    field = new Field(world, fieldLoc.x, fieldLoc.y, fieldDim.w, fieldDim.h, 1000)
	
    for (i = 0; i < nFluxum; i++) {
		let x = bucketLoc.x + 5  + Math.random() * (bucketDim.w -5)- FLUXUM_HALF_W; 
		let y = bucketLoc.y  + 5 + Math.random() * (bucketDim.h -5) - FLUXUM_HALF_W;
		if (x < bucketLoc.x) x = bucketLoc.x + FLUXUM_W;
		
    	fluxum.push(new Fluxum(world, i, x, y, FLUXUM_HALF_W, FLUXUM_HALF_W, 3));
    }
	
	boundaries.push(new Boundary(world, 0, -8, playW, 10));  // top
	boundaries.push(new Boundary(world, playW + 8, 0, 10, playH));  // right
	//boundaries.push(new Boundary(world, 0, height + 8, playW, 10));  // bottom
	boundaries.push(new Boundary(world, -8, 0, 10, playH));  // left

    // bucket
	boundaries.push(new Boundary(world, bucketLoc.x, bucketLoc.y+ bucketDim.h/2, 2, bucketDim.h/2));
	boundaries.push(new Boundary(world, bucketLoc.x + bucketDim.w, bucketLoc.y+ bucketDim.h/2, 2, bucketDim.h/2));
    boundaries.push(new Boundary(world, bucketLoc.x + bucketDim.w / 2,  bucketLoc.y + bucketDim.h, bucketDim.w / 2, 2));
	
	//fulcrum
	boundaries.push(new Boundary(world, fulcrumLoc.x,  fulcrumLoc.y + fulcrumDim.h, fulcrumDim.w / 2, fulcrumDim.h));
	
	var listener = new Box2D.Dynamics.b2ContactListener;       
    
    listener.BeginContact = function(contact){
    	let a = contact.GetFixtureA().GetBody().GetUserData();
	    let b = contact.GetFixtureB().GetBody().GetUserData();

		if (a.hasOwnProperty("id")) playSound(a.id);
		if (b.hasOwnProperty("id")) playSound(b.id);
    }
    
    world.SetContactListener(listener);
	
	textFont(silkscreenFont);
	
}

function windowResized() {
    //resizeCanvas(windowWidth, windowHeight);
}

function addToScore(n) {
	let multiplier = 1;
	
	score += n * multiplier;
}

function setScoreBasedOnX(x) {
	console.log("************* " + x );
	if (x < 2.5) {
		triggerScoreIcon(1);
		addToScore(1);
		return;
	}
	if (x < 4.8) {
		triggerScoreIcon(2);
		addToScore(2);
		return;
	}
	if (x < 7.13) {
		triggerScoreIcon(3);
		addToScore(3);
		return;
	}
	if (x < 9.4) {
		triggerScoreIcon(4);
		addToScore(4);
		return;
	}
	if (x < 11.8) {
		triggerScoreIcon(5);
		addToScore(5);
		return;
	}
	if (x < 15.1) {
		triggerScoreIcon(7);
		addToScore(5);
		return;
	}
	if (x < 17.4) {
		triggerScoreIcon(8);
		addToScore(4);
		return;
	}
	if (x < 19.7) {
		triggerScoreIcon(9);
		addToScore(3);
		return;
	}
	if (x < 22) {
		triggerScoreIcon(10);
		addToScore(2);
		return;
	}
	triggerScoreIcon(11);
	addToScore(1);
}
		
function setup(){
	
	noStroke();
	
	if (windowWidth > playW) {
		PIXEL_SCALE = windowWidth / playW;
		//console.log("scaling " + PIXEL_SCALE);
		playW *= PIXEL_SCALE;
		playH *= PIXEL_SCALE;
	}
	if (windowHeight < playH) {
		PIXEL_SCALE = windowHeight / playH;
		//console.log("scaling " + PIXEL_SCALE);
		playW *= PIXEL_SCALE;
		playH *= PIXEL_SCALE;
	}
	
	sceneCanvas = createCanvas(playW, playH);
	sceneCanvas.parent('scene-wrapper');
	frameRate(30);
	noSmooth();
	rectMode(CENTER);

	world = new b2World(new b2Vec2(0, 30), true);

	var debugDraw = new b2DebugDraw();
    debugDraw.SetSprite(document.getElementById("defaultCanvas0").getContext("2d"));
    debugDraw.SetDrawScale(PIXELS_TO_WORLD);
    debugDraw.SetFillAlpha(0.3);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    world.SetDebugDraw(debugDraw); 

    init(world);

}

function fluxlyUpdate() {

}

//setInterval(fluxlyUpdate(), 50);  // 20 times per second ok?

function draw(){
	background(0);
	image(dottedLines, 705, 90, 155, 415);
	//image(backgrounds[0], 0, 0, playW, playH);
	//world.DrawDebugData();
	
	/*for(i = 0; i < fluxum.length; i++){
		fluxum[i].renderAnimations();
	}*/
	for(i = 0; i < fluxum.length; i++){
		fluxum[i].render();
	}
	field.render();
	// Draw bucket
	stroke(255);
	strokeWeight(6);
	line(bucketLoc.x, bucketLoc.y, bucketLoc.x, bucketLoc.y + bucketDim.h );
	line(bucketLoc.x, bucketLoc.y + bucketDim.h, bucketLoc.x+ bucketDim.w, bucketLoc.y + bucketDim.h );
	line(bucketLoc.x+ bucketDim.w, bucketLoc.y + bucketDim.h, bucketLoc.x+ bucketDim.w, bucketLoc.y );
	//textSize(24);
	//text(floor(frameRate()), 20, 20);
	world.Step(1/60, 10, 10);
}

// We don't need this since all Fluxum are circular :)
function GetBodyAtMouse(includeStatic)
{
	var mouse_p = new b2Vec2(mouse_x, mouse_y);
	
	var aabb = new b2AABB();
	aabb.lowerBound.Set(mouse_x - 0.001, mouse_y - 0.001);
	aabb.upperBound.Set(mouse_x + 0.001, mouse_y + 0.001);
	
	var body = null;
	
	
	function GetBodyCallback(fixture)
	{
		var shape = fixture.GetShape();
		
		if (fixture.GetBody().GetType() != b2Body.b2_staticBody || includeStatic)
		{
			var inside = shape.TestPoint(fixture.GetBody().GetTransform(), mouse_p);
			
			if (inside)
			{
				body = fixture.GetBody();
				return false;
			}
		}
		
		return true;
	}
	
	world.QueryAABB(GetBodyCallback, aabb);
	return body;
}


function mouseDragged()
{
	var p = new b2Vec2(mouseX / PIXELS_TO_WORLD, mouseY / PIXELS_TO_WORLD);
	
	if (mouse_pressed && !mouse_joint && grabbedIndex >= 0)
	{
		//if joint exists then create
		var def = new b2MouseJointDef();
	
		def.bodyA = boundaries[0].body;
		def.bodyB = fluxum[grabbedIndex].body;
		def.target = p;

		def.collideConnected = true;
		def.maxForce = 1000 * fluxum[grabbedIndex].body.GetMass();
		def.dampingRatio = 0;
	
		mouse_joint = world.CreateJoint(def);
	
		fluxum[grabbedIndex].body.SetAwake(true);
	}

	if (mouse_joint)
	{
		mouse_joint.SetTarget(p);
	}
}

function mousePressed()
{ 
	for (i = 0; i < nFluxum; i++) {
		if (fluxum[i].mouseInBounds()) {
			//console.log("mouse in bounds " + i);
			mouse_pressed = true;
			grabbedIndex = i;
		} 
	}
}

function mouseReleased()
{
    grabbedIndex = -1;
	mouse_pressed = false;
	if(mouse_joint)
	{
		world.DestroyJoint(mouse_joint);
		mouse_joint = false;
	}
}

function doubleClicked() {
	
	//console.log("doubleclick");
	
	if (fluxum[0].mouseInBounds()) {
		console.log("Launch recording scene");
	}
}

function tilt() {
	field.body.ApplyImpulse(new b2Vec2(20.0, 20.0),
	                          field.body.GetWorldCenter());
}



