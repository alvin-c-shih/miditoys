# miditoys - Visualizations of MIDI music.

## Introduction

The Cooper Hewitt Design Museum has an exhibit featuring Dot Piano by Alexander Chen.  The user interacts with it through a MIDI keyboard hooked up to a giant screen:
* https://collection.cooperhewitt.org/objects/1141959641/
* https://twitter.com/alexanderchen/status/920263702158434305

I was pleasantly surprised that I could run it from home in Google Chrome!
* http://dotpiano.com

The web site features circular visualization that was not on display at Cooper Hewitt:
* https://youtu.be/OdbovGjt-nA

I liked it a lot, but wanted to make some changes.  Alexander Chen's video description mentioned that he used `p5.js`:
* http://p5js.org

Luckily, I'd taken "Creative Programming for Digital Media & Mobile Apps" on Coursera and had familiarity with the "Processing" language on which `p5.js` is based:
* https://www.coursera.org/learn/digitalmedia

Dot Piano is very featureful - including a playable piano using the QWERTY keyboard.  I wanted something simple that's easier for the casual JavaScript programmer (like myself) to tinker with.

The first (and only - for the moment) visualization is "Radar Simple".  Here's a video of it rendering "Airwolf":
** https://youtu.be/ZmQ-blznThY

Hope you can hack on it and have some fun!

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
* CME WIDI BUD paired with Yamaha MD-BT01

## How To Use

1. Load the `radar-simple.html` into Google Chrome.
2. Hit F11 for full screen.
3. Start sending MIDI events from your instrument.
4. (Optional) Hit F12 to look for errors or log messages.

