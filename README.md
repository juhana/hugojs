# HugoJS – online Hugo interpreter

HugoJS is an online interpreter for 
[Hugo](http://ifwiki.org/index.php/Hugo) games.

The interpreter is running at
[textadventures.online](http://textadventures.online).

If you want to host the interpreter on your own web site, the instructions
are in the wiki: 
[Hosting your own interpreter instance](../../wiki/Hosting-your-own-interpreter-instance).


## Developer's guide

### Development environment

The build scripts are made for a Unix environment (Linux/MacOS). To use them
you need [npm](https://www.npmjs.com/). `npm install` installs 
[JSHint](http://jshint.com/) and [UglifyJS2](http://lisperator.net/uglifyjs/).
JSHint is needed for code style analysis and Uglify to minify the JavaScript
files for deployment.

The www/play directory can be deployed as such (with he.js, see the next 
chapter) so the build scripts or any special setup isn't strictly necessary. 


### C engine

The repository includes all necessary JavaScript files except he.js which is the
official Hugo interpreter engine that has been compiled from C to JavaScript
with [Emscripten](http://emscripten.org/). If you don't need to modify the
engine, you can download the compiled he.js and he.js.mem files from the 
interpreter page and place them in the www/play directory.

In the he directory, [hejs.c](he/hejs.c) contains most of HugoJS-specific C code. 
It's mainly responsible for communication between the engine and the user
interface. C project setup is at the start of [heheader.h](he/heheader.h). 
There are other minor changes here and there in other C files. The changes are 
contained in `#if defined __EMSCRIPTEN__` directives.

If you need to edit and compile the C engine, you'll need to 
[install Emscripten](http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html).
The npm script `npm run compile` transpiles the C code into JavaScipt. 

If you don't need to touch the engine, you can download the compiled he.js file
from the interpreter page and place it in the www/play directory.


### User interface

The JavaScript user interface sources are in the www/play/ui directory.

* file.js: internal (virtual file system) and external (loading game files from
the Internet) file managing
* input.js: handles user input and passing it to the engine
* output.js: printing and formatting game output 
* utility.js: miscellaneous utility functions

In the www/play directory the bootstrap.js file has the setup required by
Emscripten.

The project can be built with npm.

    npm run build
     
The npm build script creates a release directory where it copies necessary 
files and minifies the scripts.

The third npm script is `npm run lint` which runs the source files through
[JSHint](http://jshint.com/) which needs to be installed either globally or 
through `npm install`.
