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
[Webpack](https://webpack.js.org/) that builds the final package.


### C engine

engine.* files in the assets directory are the official Hugo interpreter engine
that has been compiled from C to JavaScript with
[Emscripten](http://emscripten.org/).

In the repository's "he" directory [hejs.c](he/hejs.c) contains most of
HugoJS-specific C code. It's mainly responsible for communication between the 
engine and the user interface. C project setup is at the start of 
[heheader.h](he/heheader.h). There are other minor changes here and there in 
other C files. The changes are contained in `#if defined __EMSCRIPTEN__` directives.

If you need to edit and compile the C engine, you'll need to 
[install Emscripten](http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html).
The npm script `npm run compile` transpiles the C code into JavaScipt. 


### User interface

The JavaScript user interface sources are in the src directory.

* index.js: loads the necessary files and bootstraps the system
* hugo.js: HugoJS-specific code
* opcodes.js: special community-extended Hugo opcodes

[Haven](https://github.com/vorple/haven) is the actual JavaScript interpreter
that handles the game output. It's included as a git submodule.

The project can be built with Webpack. The command `npm start` starts Webpack
in watch mode (recompiles every time source files change.) Note that Webpack
doesn't watch the Emscripten engine files so you need to rebuild manually if
you recompile the Hugo engine.

Webpack creates a directory called "dist" where it copies necessary
files and minifies the scripts.

The third npm script is `npm run lint` which runs the source files through
[JSHint](http://jshint.com/) which needs to be installed either globally or 
through `npm install`.
