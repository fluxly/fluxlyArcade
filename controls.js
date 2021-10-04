function Pot(n, x, y, angle) {
	this.id = n;
	this.state = 0;
	this.angle = angle + 30;
	this.x = x + 20;
	this.y = y;
	this.pressed = false;
	
	this.reset = function() {
	}
	
	this.controlPressed = function() {
		this.pressed = true;
	}
	
	this.controlReleased = function() {
		if (this.pressed) {
			this.pressed = false;
		}
	}
	
	this.setIndicator = function(state) {
		if (state) {
			document.getElementById('pot-' + this.id).querySelector('.indicator').style.display = "block";
		} else {
			document.getElementById('pot-' + this.id).querySelector('.indicator').style.display = "none";
		}
	}
	
	this.addDevice = function() {
		document.getElementById('pot-wrapper-' + this.id).innerHTML = `
		<div id="pot-` + this.id + `"><img  src="pot-inner.svg"/><img src="pot-outer.svg"/></div>
		`;
		console.log(this.id);
		//document.getElementById('pot-' + this.id).style["background-color"] = "red";
        document.getElementById('pot-' + this.id).style["transform"] = "translate(" + this.x + "px, " + this.y + "px) rotate(30deg)";
		
	}
}