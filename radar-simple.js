/// ===== CONFIG BEGIN =====

var DISPLAY_CONFIG = {
    // Anything less than 30 fps seems too laggy.
    frameRate: 30,
    // Make background color known globally in case
    // we need to "erase" shapes later.
    backgroundColor: 'black',
    statsTextSize: 16,
}

var DEGREES_IN_CIRCLE = 360;

var MIDI_CONFIG = {
    // Tracking too many notes may introduce lag.
    noteStatusesHistorySize: 90,

    // https://www.midikits.net/midi_analyser/midi_note_numbers_for_octaves.htm
    // 88-key Keyboard:  Low A = 17, High C = 108.
    bassNote: 21,
}

var VIZ_CONFIG = {
    // How far the pen moves each time step.
    histArcMult: 0.9 * DEGREES_IN_CIRCLE / MIDI_CONFIG.noteStatusesHistorySize,
    // How big the pen should be in degrees.
    penArc: 3,

    // Rotate the entire visualization by
    //  frameCount * rotationFactor.
    rotationFactor: 0.85,

    // How much room to give each note.
    radiusMultiplier: 12,

    // MIDI volumes theoretically go to 127, but we'll
    //  cap everything at 100 since it's hard to get
    //  louder than that in practice.
    volumeConstraint: 100,

    // Held notes decay with time.
    // Makes it easier to tell if same note is being played
    //  in succession.
    volumeDecayPerFrame: 0.95,
    
    drawVolumeCutoff: 35,    // Don't bother drawing extremely faint trails.
    penWeight: 6,            // Pen fatter than trailes to see where we are in time.
    trailCountMultiplier: 3, // Make effect of increased count more visible.
    trailWeightMin: 2,       // Thinner trail to show fewer instruments on the same note.
    trailWeightMax: 8,       // Rare to see more than 5 instruments on the sme note.
}

console.info('VIZ_CONFIG.histArcMult: '+VIZ_CONFIG.histArcMult);

/// ===== CONFIG END =====

/// ===== DEBUG BEGIN =====
function info(msg){
    // Uncomment the line below for more verbose logging.
    // console.info(msg);
}
/// ===== DEBUG END =====

/// ===== MIDI BEGIN =====

// Helper function to make new note objects.
function makeNoteStatus(count, volume) {
    return {count: count, volume: volume};
}

// Notes indexed by MIDI note ID.

// Use copy-on-write for currentNoteStatuses entries to allow us to
//  get away with shallow copies of currentNoteStatuses into
//  noteStatusesHistory.
var currentNoteStatuses = [];

function initMidi() {
    WebMidi.enable(function (err) {
	if (err) {
	    console.log("WebMidi could not be enabled.", err);
	} else {
	    console.log("WebMidi enabled!");
	    console.log(WebMidi.inputs);
	    console.log(WebMidi.outputs);

	    // Listen for events across all inputs.
	    for(var i = 0 ; i < WebMidi.inputs.length ; ++i) {
		var input = WebMidi.inputs[i];
		console.log('input - manufacturer: '+input.manufacturer+', name: '+input.name);
		// Listen for events on all channels.
		input.addListener('noteon', "all", noteOn);
		input.addListener('noteoff', "all", noteOff);
		input.addListener('controlchange', "all", controlChange);
	    }
	}
    });
}

function noteOn(event) {
    var note = event.note.number;
    var noteStatus0 = currentNoteStatuses[note];
    // Increase the count.
    var count1 = noteStatus0 ? noteStatus0.count + 1 : 1;
    // Use the latest velocity for the note.  (Subject to change.)
    var volume1 = event.rawVelocity;
    
    info('noteOn - channel: '+event.channel+', count1: '+count1+', note: '+note+', volume1: '+volume1);

    // There might be a copy of the note in the history.
    // Make a new object so we don't disturb the old ones.
    currentNoteStatuses[note] = makeNoteStatus(count1, volume1);
}

function noteOff(event) {
    var note = event.note.number;
    var noteStatus0 = currentNoteStatuses[note];
    if(!noteStatus0){
	// Note probaby deleted due to volume decay.
	return;
    }
    // Decrease the count.
    var count1 = noteStatus0.count - 1;
    // If all channels have released the note, set the volume to 0.
    var volume1 = count1 == 0 ? 0 : noteStatus0.volume;
    
    info('noteOff - channel: '+event.channel+', count1: '+count1+', note: '+note);
    
    // There might be a copy of the note in the history.
    // Make a new object so we don't disturb the old ones.
    currentNoteStatuses[note] = makeNoteStatus(count1,volume1);
}


function controlChange(event){
    info('controlChange - name: '+event.controller.name+', number: '+event.controller.number+', value: '+event.value);
}

/// ===== MIDI END =====

var frameCount = 0;

// https://github.com/processing/p5.js/wiki/p5.js-overview
// <style> body {padding: 0; margin: 0; background-color: black} </style>
// https://stackoverflow.com/questions/4288253/html5-canvas-100-width-height-of-viewport
function windowResized() {
    // Need to subtract 4 from the height to avoid scroll bars?!?
    // Use black background to hide that.
    console.log('windowResized: windowWidth='+windowWidth+', windowHeight: '+windowHeight);
    resizeCanvas(windowWidth, windowHeight);
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(DISPLAY_CONFIG.frameRate);
    angleMode(DEGREES);
    colorMode(HSB, 100);
    initMidi();
}

// Build up a history for visualizations over time.
var noteStatusesHistory = [];

// Assign hues to notes.  Don't overthink these.
var noteHues = [
    0, 9, 14, 25, 51,
    58, 63, 68, 73, 81, 85, 91
]

// fade from 0 to 100
// fade = passed in to allow overriding to draw pens
// @return number of objects drawn
function drawArc(note,histOffset,volume,fade,penMode,count) {
    var hue = noteHues[note%12];
    // More saturated for louder sounds.
    var saturation = constrain(volume, 35, 100);
    stroke(hue,saturation,penMode ? 100 : fade);

    var trailWeight = constrain(VIZ_CONFIG.trailCountMultiplier*count,
				VIZ_CONFIG.trailWeightMin, VIZ_CONFIG.trailWeightMax);
    strokeWeight(penMode ? VIZ_CONFIG.penWeight : trailWeight);
    
    var radius = (note-MIDI_CONFIG.bassNote) * VIZ_CONFIG.radiusMultiplier;
    var angle = VIZ_CONFIG.histArcMult * histOffset;
    arc(0, 0, radius, radius, angle, angle+VIZ_CONFIG.penArc);
    // Track number of objects drawn per frame to detect when
    //  slowdown occurs.
    return 1;
}


// Draw the trails.
// ----------> frameCount : highest is newest
//         <-- historyOffset : lowest is newest
// @return number of objects drawn
function drawNoteStatuses(historyOffset,penMode) {
    var objectsDrawn = 0;
    var noteStatusesHistoryIndex = frameCount - historyOffset;
    var noteStatuses = noteStatusesHistory[noteStatusesHistoryIndex % MIDI_CONFIG.noteStatusesHistorySize];
    if(!noteStatuses){
	return objectsDrawn;
    }

    var fade = 100 * (1.0 - historyOffset / MIDI_CONFIG.noteStatusesHistorySize);
    // Loop over active notes.
    for(var note in noteStatuses) {
	var noteStatus0 = noteStatuses[note];
	var count0 = noteStatus0.count;
	var volume0 = noteStatus0.volume;
	objectsDrawn += drawArc(note,noteStatusesHistoryIndex,volume0,fade,penMode,count0);
    }
    
    return objectsDrawn;
}

// Draw oldest history first so newer information is rendered on top.
function drawTrails() {
    // Center the circle.
    translate(width/2,height/2);
    // Rotate a bit each frame to give added sense of motion.
    rotate(frameCount * VIZ_CONFIG.rotationFactor);
    // Track the number of objects drawn per frame for logging / graphing.

    var objectsDrawn = 0;
    // We'll be drawing arcs.  Disable fill up front.
    noFill();
    for(var historyOffset = MIDI_CONFIG.noteStatusesHistorySize-1 ; historyOffset >= 1 ; --historyOffset) {
	objectsDrawn += drawNoteStatuses(historyOffset,false);
    } // for(historyOffset)
    // currentNoteStatuses has an offset of zero.
    // Use those to draw the pen.
    objectsDrawn += drawNoteStatuses(0,true);
    
    return objectsDrawn;
}

function setupFrame() {
    blendMode(BLEND);
    background(DISPLAY_CONFIG.backgroundColor);
}

// Update current notes volume by multiplying by decay factor.
// @return max note number
function processVolumeDecay() {
    var highestNote = 0;

    // Loop over active notes.
    for(var note in currentNoteStatuses) {
	var noteStatus0 = currentNoteStatuses[note];
        if(note > highestNote) {
	    highestNote = note;
	}
	var count0 = noteStatus0.count;
	var volume0 = noteStatus0.volume;
	var volume1 = volume0 * VIZ_CONFIG.volumeDecayPerFrame;
	if (volume1 >= VIZ_CONFIG.drawVolumeCutoff){
	    // Create a new object to avoid disturbing objects in history.
	    currentNoteStatuses[note] = makeNoteStatus(count0, volume1);
	} else {
	    // Volume fell below cutoff.  Delete it to save compute cycles.
	    delete currentNoteStatuses[note];
	}
    }
    return highestNote;
}

function drawStat(i, name, value, maxValue) {
    textSize(DISPLAY_CONFIG.statsTextSize);

    var barWidth = 15;
    var textMargin = 5;

    var valuePct = constrain(value / maxValue, 0, 1);
    var valuePctY = windowHeight*(1-valuePct);
    rect(i*(barWidth+textMargin),valuePctY,barWidth,windowHeight-1);

    text(name+': '+value,(i+1)*(barWidth+textMargin),valuePctY+DISPLAY_CONFIG.statsTextSize);
}


var highestNoteMax = 0;

// Draw statistics to help the developer.
// Too many notes may require changes in volumeDecayPerFrame or drawVolumeCutoff.
// highestNote can help suggest how scaling factors need tweaking. 
function drawStats(stats) {
    textAlign(LEFT);
    fill('gray');
    blendMode(ADD);
    drawStat(0, 'objectsDrawn', stats.objectsDrawn, 800);
    drawStat(1, 'highestNote', stats.highestNote, 127);
    // drawStat(2, 'highestNoteMax', stats.highestNoteMax, 127);
}

// Called once per frame.
function draw() {
    setupFrame();

    // Copy currentNoteStatuses into a circular buffer.
    // currentNoteStatuses will be mutated below due to decay.
    noteStatusesHistory[frameCount % MIDI_CONFIG.noteStatusesHistorySize] = currentNoteStatuses.slice();
    
    var objectsDrawn = 0;

    // Drawing the trails is going to translate / rotate the
    //  coordinate system.  Won't want that when drawing text later.
    push();
    objectsDrawn += drawTrails();
    pop()

    // Decay volume for currently playing notes.
    var highestNote = processVolumeDecay();
    if (highestNote > highestNoteMax ) {
	highestNoteMax = highestNote;
    }

    var stats = {
	objectsDrawn: objectsDrawn,
	highestNote: highestNote,
	highestNoteMax: highestNoteMax,
    };
    drawStats(stats);
    
    ++frameCount;
}
