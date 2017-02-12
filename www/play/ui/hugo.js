(function() {
    var hugoui = {};

    var windowDimensions = [];

    /**
     * When the window size changes, measures the window width in characters.
     */
    function measureDimensions() {
        var outputContainer = haven.window.get( 0 ).parentNode,
            dimensions = {
                window: {
                    width: parseInt( window.getComputedStyle( outputContainer ).width, 10 ),
                    height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
                },
                line: {},
                char: {}
            },
            measureElem = document.createElement( 'span' ),
            outputDimensions = dimensions.window,
            measureElemHeight;

        measureElem.innerHTML = '00000<br>00000<br>00000';
        measureElem.className = 'font-fixed-width';
        measureElem.style.display = 'inline-block';

        outputContainer.appendChild( measureElem );

        dimensions.char.width = measureElem.offsetWidth / 5;
        dimensions.line.width = Math.floor( outputDimensions.width / dimensions.char.width - 1 );

        measureElem.style.display = 'block';
        measureElemHeight = measureElem.clientHeight;
        measureElem.innerHTML += '<br>00000<br>00000';
        dimensions.char.height = ( measureElem.clientHeight - measureElemHeight ) / 2;
        dimensions.line.height = Math.floor( outputDimensions.height / dimensions.char.height );

        measureElem.parentNode.removeChild( measureElem );

//        console.log(dimensions);
        return dimensions;
    }


    /**
     * Send the window dimensions to the engine
     */
    function sendWindowDimensions() {
        var dimensions = measureDimensions();
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
        // Redirect to an exit URL when the game ends.
        // A fatal error should block the redirection.
        // As a crude check for whether an error was thrown,
        // check if the error message div is present.
        if( hugojs_options.exit_url && !document.getElementById( 'fatal-error' ) ) {
            // if any text is printed after previous input,
            // wait for keypress/click before redirecting
            if( hugoui.isTextPrinted ) {
                haven.input.setMode( 'endgame' );
            }
            else {
                window.location = hugojs_options.exit_url;
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

            virtualStoryfile: 'game.hex'
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

        sendWindowDimensions();
    };


    /**
     * Set the cursor position.
     */
    hugoui.position = {
        /*
        reset: function( hugoWindow ) {
            // if no window specified, reset all positions
            if( hugoWindow === undefined ) {
                position = {
                    col: null,
                    line: null
                };
            }
            else {
                setPosition( null, null, hugoWindow );
            }
        },
*/
        set: function( column, line, hugoWindow ) {
//                console.log( 'setting position  line', line, 'col', column, 'window', hugoWindow );
            haven.window.position.set( column, line, hugoWindow );
        }
    };


    hugoui.print = function( text, hugoWindow ) {
        haven.buffer.append( text, hugoWindow );
    };


    /**
     * Reset UI state after restore
     */
    hugoui.restoreUI = function() {
        haven.state.restoreUI();
    };


    hugoui.sendWindowDimensions = sendWindowDimensions;


    /**
     * Sets the window title. Called by the engine.
     *
     * @param title
     */
    hugoui.setTitle = function( title ) {
        haven.window.setTitle( title );
    };


    hugoui.window = {
        /**
         * Create a new Hugo window.
         *
         * @param hugoWindow
         * @param left
         * @param top
         * @param right
         * @param bottom
         */
        create: function( hugoWindow, left, top, right, bottom ) {
//                console.log( 'creating window', hugoWindow + ':  left', left, 'top', top, 'right', right, 'bottom', bottom );
            var newWindow,
                dimensions = measureDimensions(),
                charHeight = dimensions.char.height,
                mainContainer = haven.window.get( 0 ).parentNode;

            windowDimensions[ hugoWindow ] = {
                left: left,
                top: top,
                right: right,
                bottom: bottom
            };

            if( !hugojs_options.windowing ) {
                return false;
            }

            // the main window only changes size
            if( hugoWindow === 0 ) {
//                outputWindow[0].style.paddingLeft = ( left - 1 ) + 'px';
                haven.window.get( 0 ).style.paddingTop = ( ( top - 1 ) * dimensions.char.height ) + 'px';
//                outputWindow[0].style.width = ( ( right + 1 ) * dimensions.char.width ) + 'px';
                return;
            }

            if( haven.window.get( hugoWindow ) ) {
                mainContainer.removeChild( haven.window.get( hugoWindow ) );
            }

            newWindow = document.createElement( 'div' );
            newWindow.id = 'window' + hugoWindow;
            newWindow.className = 'hugowindow';
            newWindow.style.height = charHeight * ( bottom - top + 1) + 'px';
            newWindow.style.top = ( ( top - 1 ) * charHeight ) + 'px';
            newWindow.style.marginLeft = ( left - 1 ) + 'px';
            newWindow.style.width = ( ( right - left + 2 ) * dimensions.char.width ) + 'px';

            haven.window.container.append( newWindow, mainContainer );
            haven.style.apply( newWindow, hugoWindow );
        }
    };

    // Set Emscripten's command line arguments that load the story file
    window.Module.arguments = [ '/game.hex' ];

    window.hugoui = hugoui;
})();