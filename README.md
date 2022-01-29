# HugoJS – Online Hugo Interpreter

HugoJS is an online interpreter for [Hugo](http://ifwiki.org/index.php/Hugo) games.

The interpreter is running at [textadventures.online](http://textadventures.online).

If you want to host the interpreter on your own web site, see [Hosting your own interpreter instance](../../wiki/Hosting-your-own-interpreter-instance).

For more documentation, see the [wiki pages](../../wiki).


## Development Environment

### Installation

The build scripts are made for a Unix environment (Linux/MacOS). To use them you need [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/). npm comes with a standard [Node.js](https://nodejs.org) installation. `npm install` (or `yarn install`) installs [Webpack](https://webpack.js.org/) that builds the final package.

Alternatively you can download the engine files from the online interpreter instance: [he.js](http://hugo.caltrops.com/play/he.js) and [he.wasm](http://hugo.caltrops.com/play/he.wasm). Place the files into the assets directory.

### Dev server

Run `npm start` (or `yarn start`) to start the development server on localhost:8080. The server automatically reloads the page when you make changes to the source files. Ctrl+C stops the server.

Use the URL http://localhost:8080/play/index.html to access the interpreter.

The development server serves any files found in a directory called "library" in the root of the project. If you create that directory and put test story files there, you can run them using the URL http://localhost:8080/play/index.html?story=/story.hex where "story.hex" is the name of the story file. Note that the leading `/` character is required.


## C Engine

The interpreter engine itself is the official Hugo interpreter engine that has been compiled from C to JavaScript with [Emscripten](http://emscripten.org/).

In the repository's "he" directory [hejs.c](he/hejs.c) contains most of HugoJS-specific C code. It's mainly responsible for communication between the engine and the user interface. C project setup is at the start of [heheader.h](he/heheader.h). There are other minor changes here and there in other C files. The changes are contained in `#if defined __EMSCRIPTEN__` directives.

If you make changes to the C interpreter, you need to run the `npm run compile` (or `yarn compile`) command to regenerate the JS files using a [Docker](https://docker.com) image that has Emscripten pre-installed. You need to first install Docker to do this.


## User Interface

The JavaScript user interface sources are in the src directory.

* index.js: loads the necessary files and bootstraps the system
* hugo.js: HugoJS-specific code
* opcodes.js: special community-extended Hugo opcodes

[Haven](https://github.com/vorple/haven) is the actual JavaScript interpreter that handles the game output. It's included as a git submodule.


## Development Scripts

The command `npm start` (or `yarn start`) starts Webpack in watch mode (recompiles every time source files change.) 

To build the project for deployment use `npm run build` (or `yarn build`). Webpack creates a directory called "dist" where it copies necessary files and minifies the scripts. The build script creates a hugojs.zip package of the files for deployment. 

`npm run compile` (or `yarn compile`) compiles the C interpreter into JavaScript.

`npm run lint` (or `yarn lint`) runs the source files through [ESLint](https://eslint.org) and checks that the coding style is consistent.
