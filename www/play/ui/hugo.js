(function() {
    var hugoui = {};

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

            // let the Hugo engine set the font family
            // (fixed width or proportional)
            engineFontFamily: true,

            // user-provided options
            options: hugojs_options,

            // no Unicode support
            unicode: false,

            // the name of the story file in the virtual filesystem
            virtualStoryfile: 'game.hex'
        });

        if( hugoui.opcodes ) {
            hugoui.opcodes.init();
        }
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
    };


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