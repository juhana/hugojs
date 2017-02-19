(function( hugoui ) {
    "use strict";

        // command history
    var cmdHistory = [],

        // current position in the command history. -1: new input
        currentCmdHistory = -1,

        // stores the currently typed command when browsing the history
        currentCmdText = "",

        // input element
        input = document.getElementById( 'input' ),

        // input element's location in relation to the Hugo window
        inputX = 0,

        // current mode of input the game expects: buffer, getkey, getline or endgame.
        // null is no input accepted (during startup)
        inputMode = null,

        // stores keypresses pressed when the engine isn't specifically expecting them ("buffer" inputMode)
        keypressBuffer = [],

        // entire prompt
        prompt = document.getElementById( 'prompt' );


    /**
     * Change the prompt input to next or previous command in the command history.
     *
     * @param delta 1 for next command, -1 for previous
     */
    function getCmdFromHistory( delta ) {
        var current = currentCmdHistory,
            new_current = current + delta;

        if( current === -1 ) {
            currentCmdText = input.value;
        }

        // Check it's within range
        if( new_current < cmdHistory.length && new_current >= 0 )
        {
            input.value = cmdHistory[ new_current ];
            currentCmdHistory = new_current;
        }
        else if( new_current === -1 ) {
            input.value = currentCmdText;
            currentCmdHistory = new_current;
        }
    }


    /**
     * Resize the input field so that it fits on the same line as the prompt.
     */
    function resizeInput() {
        input.parentNode.style.width = ( hugoui.getOutputWindow( 0 ).clientWidth - inputX - 2 ) + 'px';
    }


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
                inputMode = 'endgame';
            }
            else {
                window.location = hugojs_options.exit_url;
            }
        }
    };


    /**
     * For passing the command history to and from autosave.
     */
    hugoui.getCmdHistory = function() {
        return cmdHistory;
    };

    hugoui.setCmdHistory = function( newHistory ) {
        cmdHistory = newHistory;
    };


    hugoui.keypress = {
        /**
         * Called when the game starts.
         */
        init: function() {
            // start expecting keypresses
            if( !inputMode ) {
                inputMode = 'buffer';
            }
        },

        /**
         * Check if there's a keypress waiting in the buffer.
         *
         * Called by the engine.
         *
         * @returns {boolean}
         */
        is_waiting: function() {
            hugoui.buffer.flush();

            if( hugoui.isTextPrinted ) {
                hugoui.scrollOrFocus();
            }

            return keypressBuffer.length > 0;
        },

        send: function( e ) {
            var keyCode = e.keyCode,
                doc = document.documentElement,
                scrolltop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

            // don't react to modifier keys
            if( e.altKey || e.ctrlKey || e.metaKey || e.shiftKey ) {
                return;
            }

            switch( inputMode ) {
                case 'buffer':
                    keypressBuffer.push( keyCode );
                    break;

                case 'getline':
                case null:
                    // do nothing except scroll
                    hugoui.scrollOrFocus(e);
                    return;

                case 'getkey':
                    // continue with script
                    break;

                case 'endgame':
                    window.location = hugojs_options.exit_url;
                    return;

                default:
                    hugoui.error( 'Interpreter error: unknown inputMode ' + inputMode );
            }

            inputMode = 'buffer';

            // let the scroll handler take this if we're not at the end of the page
            if( scrolltop + window.innerHeight < document.body.clientHeight - 40 ) {
                hugoui.scrollOrFocus(e);
                return;
            }

            Module.ccall(
                'hugojs_getkey',
                'null',
                [ 'number' ],
                [ keyCode ]
            );
        },

        wait: function() {
            inputMode = 'getkey';

            hugoui.buffer.flush();

            hugoui.doScroll = true;

            // if there's something in the keypress buffer, "push" that key
            if( keypressBuffer.length > 0 ) {
                hugoui.keypress.send({ keyCode: keypressBuffer.shift() });
            }
        }
    };


    /**
     * Show and hide the prompt
     */
    hugoui.prompt = {
        form: prompt,

        hide: function() {
            inputMode = 'buffer';

            if( prompt.parentNode ) {
                prompt.parentNode.removeChild( prompt );
            }
        },

        input: input,

        show: function() {
            inputMode = 'getline';

            hugoui.buffer.flush();
            hugoui.getOutputWindow( 0 ).appendChild( prompt );
            input.parentNode.style.width = '50px';
            inputX = input.offsetLeft - hugoui.getOutputWindow( 0 ).offsetLeft;
            resizeInput();

            // scroll page down or give the prompt focus
            hugoui.scrollOrFocus();
            hugoui.doScroll = true;

            // do autosave when line input is expected
            hugoui.autosave();
        }
    };


    /**
     * INIT
     */


    // handle line input submission
    prompt.addEventListener( 'submit', function( e ) {
        e.preventDefault();
        
        // Change accented characters to plain ASCII.
        // The engine doesn't receive non-ASCII characters correctly.
        input.value = input.value.replace( /[^\u0000-\u007E]/g, function( a ) {
            return diacriticsMap[ a ] || a;
        });

        // save input to history
        if ( input.value !== cmdHistory[0] && /\S/.test( input.value ) )
        {
            cmdHistory.unshift( input.value );
        }

        currentCmdHistory = -1;

        // pass the command to the engine
        Module.ccall(
            'hugojs_getline',
            'null',
            [ 'string' ],
            [ input.value + '\n' ]
        );

        // cleanup
        input.value = "";
        hugoui.prompt.hide();
        hugoui.buffer.newline( 0 );
    });

    // Command history. Adapted from Parchment.
    input.addEventListener( 'keydown', function( e ) {
        var keyCode = e.which || e.keyCode;

        // Check for up/down to use the command history
        if ( keyCode === 38 ) // up -> prev
        {
            getCmdFromHistory( 1 );
            e.preventDefault();
        }
        if ( keyCode === 40 ) // down -> next
        {
            getCmdFromHistory( -1 );
            e.preventDefault();
        }
    });


    /**
     * INIT
     */
    // remove the prompt from the DOM
    prompt.parentNode.removeChild( prompt );

    // listen to keypresses and mouse clicks
    document.addEventListener( 'keydown', hugoui.keypress.send, false );
    document.addEventListener( 'click', hugoui.keypress.send, false );

    // resize input field when window size changes
    window.addEventListener( 'resize', resizeInput, false );

    // fix Mobile Safari bug that breaks fixed positioning when the virtual keyboard pops up
    if( 'ontouchstart' in window ) {
        // the focus event at the start of the game doesn't open the keyboard
        var firstFocus = true;

        input.addEventListener( 'focus', function () {
            if( !firstFocus ) {
                document.body.classList.add( "safarifix" );
            }
            else {
                firstFocus = false;
            }
        } );

        input.addEventListener( 'blur', function () {
            document.body.classList.remove( "safarifix" );
        } );
    }

    window.hugoui = hugoui;
})( window.hugoui || {} );