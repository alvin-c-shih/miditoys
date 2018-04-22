# miditoys - Visualizations of MIDI music.

## Introduction

Inspired by Dot Piano!
* http://dotpiano.com
* https://collection.cooperhewitt.org/objects/1141959641/
* https://youtu.be/OdbovGjt-nA

Dot Piano does a lot, including provide a playable piano using the
QWERTY keyboard.

This is my attempt at something similar that's easier for the casual
JavaScript programmer (like myself) to tinker with.

## Requirements

### Web browser that supports Web MIDI 
The browsers that support the Web MIDI API are listed here:
* https://developer.mozilla.org/en-US/docs/Web/API/MIDIAccess

Browsers that work:
* Google Chrome

Browseres that don't work:
* Microsoft Edge
* Mozilla Firefox

### USB MIDI Interface

Devices that worked with Windows 10 after installing the appropriate driver:
* Roland Digital Piano
* Korg synthesizer

## How To Use

1. Load the `radar-simple.html` into Google Chrome.
2. Hit F11 for full screen.
3. Start sending MIDI events from your instrument.
4. (Optional) Hit F12 to look for errors or log messages.

