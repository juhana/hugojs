(function() {
    var hugoui = {};

    var OPCODE_CONTROL_FILE = "OpCtlAPI",
        OPCODE_CHECK_FILE = "OpCheck";


    /**
     * Clear target window, or if omitted, the entire screen.
     *
     * @param hugoWindow
     */
    hugoui.clear = function( hugoWindow ) {
        haven.window.clear( hugoWindow );
    };


    hugoui.color = {
        /**
         * Set colors in windows
         *
         * @param which
         * @param color
         * @param hugoWindow
         */
        set: function( which, color, hugoWindow ) {
            haven.style.color.set( which, color, hugoWindow );
        }
    };


    hugoui.font = {
        /**
         * Set font styles
         *
         * @param f
         * @param hugoWindow
         */
        set: function( f, hugoWindow ) {
            haven.style.set( "bold", !!( f & 1 ), hugoWindow );
            haven.style.set( "italic", !!( f & 2 ), hugoWindow );
            haven.style.set( "underline", !!( f & 4 ), hugoWindow );
            haven.style.set( "proportional", !!( f & 8 ), hugoWindow );
            haven.style.set( "original", f, hugoWindow );

            // setStyle( flushedText, hugoWindow );
        }
    };


    /**
     * Called by the engine when the game has ended.
     */
    hugoui.gameEnded = function() {
        // delete the autosave file
        if( haven.options.get( 'autosave' ) ) {
            haven.state.autosave.remove();
        }

        // Redirect to an exit URL when the game ends.
        // A fatal error should block the redirection.
        // As a crude check for whether an error was thrown,
        // check if the error message div is present.
        if( haven.options.get( 'exit_url' ) && !document.getElementById( 'fatal-error' ) ) {
            // if any text is printed after previous input,
            // wait for keypress/click before redirecting
            if( haven.isTextPrinted ) {
                haven.input.setMode( 'endgame' );
            }
            else {
                window.location = haven.options.get( 'exit_url' );
            }
        }
    };


    /**
     * Initialize HugoJS methods and start Haven
     */
    hugoui.init = function() {
        haven.start({
            // the Hugo engine will handle printing the prompt,
            // as opposed to Vorple that uses a custom prompt
            enginePrompt: true,

            // no Unicode support
            unicode: false,

            // the name of the story file in the virtual filesystem
            virtualStoryfile: 'game.hex'
        });

        // save the virtual file that tells the game file we support extra opcodes
        haven.assets.addCallback( function( done ) {
            FS.syncfs( true, function () {
                if( haven.options.get( 'extra_opcodes' ) ) {
                    FS.writeFile(
                        OPCODE_CHECK_FILE,
                        [ 89, 47 ],   // == 12121
                        {encoding: 'binary'}
                    );
                }
                else {
                    try {
                        FS.unlink( OPCODE_CHECK_FILE );
                    }
                    catch(e) {}
                }

                FS.syncfs( false, done );
            });
        });
    };


    /**
     * Send the current window dimensions back to the engine.
     *
     * Called by the engine when it needs to init the display.
     */
    hugoui.initScreen = function() {
        var loader = document.getElementById( 'loader' );

        if( loader ) {
            loader.parentNode.removeChild( loader );
        }

        hugoui.sendWindowDimensions();
    };


    /**
     * Set the print cursor position.
     */
    hugoui.position = {
        set: function( column, line, hugoWindow ) {
//                console.log( 'setting position  line', line, 'col', column, 'window', hugoWindow );
            haven.window.position.set( column, line, hugoWindow );
        }
    };


    /**
     * Print text.
     *
     * @param text
     * @param hugoWindow
     */
    hugoui.print = function( text, hugoWindow ) {
        // \n is a carriage return, not needed in the browser environment
        if( text === '\n' ) {
            return;
        }

        haven.buffer.append( text, hugoWindow );
    };


    /**
     * The engine has written to the opcode file. See what's in it,
     * execute the opcode, and write the response (if any).
     */
    hugoui.process_opcode_file = function() {
        if( !haven.options.get( 'extra_opcodes' ) ) {
            return;
        }

        var opcodeData = FS.readFile( OPCODE_CONTROL_FILE ),
            op = opcodeData[ 0 ] + opcodeData[ 1 ] * 256,
            response = [];

        var addResponse = function( value ) {
            response.push( value % 256 );
            response.push( value >> 8 );
        };

        var opcodes = {
            1: function() {
                if( opcodes[ opcodeData[ 2 ] + opcodeData[ 3 ] * 256 ] ) {
                    addResponse( 1 );
                }
                else {
                    addResponse( 0 );
                }
            },

            200: function() {   // GET_OS
                addResponse( 6 );   // 6 = Browser
            },

            300: function() {   // ABORT
                // try to close the window – won't work unless the interpreter
                // window was programmatically opened by another page
                window.close();

                // quick-and-dirty abort by throwing an exception
                throw new Error( 'Abort opcode called' );
            },

            500: function() {   // OPEN_URL
                var url = Module.ccall(
                    'hugojs_get_dictionary_word',
                    'string',
                    [ 'int' ],
                    [ opcodeData[ 2 ] + opcodeData[ 3 ] * 256 ]
                );

                if( confirm( 'Game wants to open web address ' + url + '. Continue?' ) ) {
                    window.open( url );
                }
            },

            800: function() {   // IS_MUSIC_PLAYING
                addResponse( 0 );
            },

            900: function() {   // IS_SAMPLE_PLAYING
                addResponse( 0 );
            },

            1000: function() {  // IS_FLUID_LAYOUT
                addResponse( 1 );
            },
            /*
             1100: function() {  // SET_COLOR
             hugoui.setCustomColor( opcodeData[ 2 ], opcodeData[ 4 ], opcodeData[ 6 ], opcodeData[ 8 ] );
             },
             */
            1300: function() {  // HIDES_CURSOR
                addResponse( 1 );
            }
        };

        if( opcodes[ op ] ) {
            opcodes[ op ]();
            FS.writeFile( OPCODE_CONTROL_FILE, response, { encoding: 'binary' } );
        }
    };


    /**
     * Reset UI state after restore
     */
    hugoui.restoreUI = function() {
        haven.state.restoreUI();
    };


    /**
     * Send the window dimensions to the engine (Hugo only)
     */
    hugoui.sendWindowDimensions = function() {
        var dimensions = haven.window.measureDimensions();
//        console.log( 'sending dimensions', dimensions);

        Module.ccall(
            'hugo_set_window_dimensions',
            'null',
            [ 'number', 'number', 'number', 'number', 'number', 'number' ],
            [
                dimensions.window.width,
                dimensions.window.height,
                dimensions.line.width,
                dimensions.line.height,
                dimensions.char.width,
                dimensions.char.height
            ]
        );
    }


    /**
     * Sets the window title. Called by the engine.
     *
     * @param title
     */
    hugoui.setTitle = function( title ) {
        haven.window.setTitle( title );
    };


    // Set Emscripten's command line arguments that load the story file
    window.Module.arguments = [ '/game.hex' ];

    window.hugoui = hugoui;
})();