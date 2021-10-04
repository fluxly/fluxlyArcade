var direction = [  ];
var prevDirection = [  ];
var sounds = new Array();
var sounds_reverse = new Array();
var soundsLoaded = false;
var nSounds = 16;

const wavdir = "../wav/";

function setupTestControls() {
	let s = ``;
	for (i=0; i < nSounds; i++) {
		s +=`<div class="slidecontainer">
			<input type="range" min="-4.0" max="4.0" value="0.0" step=".001" class="slider" oninput="updateSlider(this.value, this.id)" id="`+ i +`">
		</div>`;
		s += `<a href="javascript:playSound(` + i + `)">Play ` + (i+1) +`</a> | <a href="javascript:stopSound(` + i + `)">Stop ` + (i+1) +`</a><br/>`;
	}
	document.getElementById("sound-controls").innerHTML = s;
}

function loadSounds() {
	
	for (i = 0; i < nSounds; i++) {
		sounds.push(
			new Howl({ src: ['mp3/sample' + 0 + '.mp3'], autoplay:false, rate: 0, loop: false })
		);
		sounds_reverse.push(
			new Howl({ src: ['mp3/sample' + 0 + '.mp3'], autoplay:false, rate: 0, loop: false })
			//new Howl({ src: [wavdir + 'sample' + 0 + '-reverse.wav'], autoplay:false, rate: 0, loop: true })
		);
		sounds[i].volume(0.5);
		sounds_reverse[i].volume(1.0);
		direction.push(0);
        prevDirection.push(0);
	}  
	soundLoaded = true;
}

function playSound(n) {
	if (!sounds[n % nSounds].playing()) 
		sounds[n % nSounds].play();
}

function stopSound(n) {
	if (direction[n] >= 0) {
		sounds[n % nSounds].stop();
	} else {
		sounds_reverse[n % nSounds].stop();
	}
}

function updateSlider(value, id) {
/*	if (!soundLoaded) return;
    id = id % nSounds;
	var rate = Math.abs(value);
    if (rate == 0) {
		sounds[id].rate(rate);
		direction[id] = 0;
		prevDirection[id] = 0;
	} else {
		direction[id] = value / rate;
		if (prevDirection[id] != direction[id]) {
			if (direction[id] == 1) {
				sounds_reverse[id].rate(0);
				sounds[id].rate(rate);
			} else {
				sounds[id].rate(0);
				sounds_reverse[id].rate(rate);
			}
		}
		prevDirection[i] = direction[i];
	}
	*/
}