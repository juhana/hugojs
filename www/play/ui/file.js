(function( hugoui ) {
    "use strict";

    var interpreterLoaded = false,
        isGamefileLoaded = false,
        gamefile,
        checksum,
        datadir,
        autosaveFilename;

    var OPCODE_CONTROL_FILE = "OpCtlAPI",
        OPCODE_CHECK_FILE = "OpCheck";


    /**
     * FNV32-algorithm to calculate the story file's checksum.
     * The checksum is used to name the directories for save games.
     *
     * Taken from https://codepen.io/ImagineProgramming/post/checksum-algorithms-in-javascript-checksum-js-engine
     */
    function fnv32( a ) {
        var len = a.length,
            fnv = 0;

        for( var i = 0; i < len; i++ ) {
            fnv = (fnv + (((fnv << 1) + (fnv << 4) + (fnv << 7) + (fnv << 8) + (fnv << 24)) >>> 0)) ^ (a[ i ] & 0xff);
        }

        return fnv >>> 0;
    }


    /**
     * Pass the autosave's filename to the engine that takes care of
     * reloading the save.
     */
    function restoreAutosave() {
        try {
            // Try to open the autosave file.
            // If it doesn't exist, this throws an error.
            FS.stat( autosaveFilename );

            Module.ccall(
                'hugojs_set_autosave_filename',
                'null',
                [ 'string' ],
                [ autosaveFilename ]
            );
        }
        catch(e) {
            // autosave file doesn't exist, do nothing
        }
    }


    /**
     * Writes the loaded game file into the virtual file system, but only
     * if both the interpreter and the game file are both loaded.
     */
    function writeGamefile() {
        if( !interpreterLoaded || !isGamefileLoaded ) {
            if( !interpreterLoaded ) {
                document.getElementById( 'loader-message' ).innerHTML = 'Loading interpreter';
            }
            else {
                document.getElementById( 'loader-message' ).innerHTML = 'Loading game file';
            }

            return;
        }

        document.getElementById( 'loader-message' ).innerHTML = 'Starting game';

        FS.writeFile(
            'game.hex',
            gamefile,
            { encoding: 'binary' }
        );

        // create the virtual savefile directory if it doesn't exist
        datadir = '/gamedata_' + checksum;

        if( !FS.analyzePath( datadir ).exists ) {
            FS.mkdir( datadir );
        }

        FS.mount( IDBFS, { root: '.' }, datadir );

        // create a directory for shared game data
        if( !FS.analyzePath( 'gamedata' ).exists ) {
            FS.mkdir( 'gamedata' );
        }

        FS.mount( IDBFS, { root: '.' }, 'gamedata' );
        FS.chdir( 'gamedata' );

        // synchronize with local data
        FS.syncfs( true, function() {
            if( hugojs_options.autosave ) {
                autosaveFilename = '/gamedata_' + checksum + '/autosave';
                restoreAutosave();
            }

            // start reacting to keypresses
            hugoui.keypress.init();

            // save the virtual file that tells the game file we support extra opcodes
            if( hugojs_options.extra_opcodes ) {
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

            // tell the engine to start the game
            _hugojs_start();
        });

        // This function is defined in the C code.
        // It signals that the UI and the game file are ready and the game can be started.
    }

    function gamefileLoaded( buffer ) {
        isGamefileLoaded = true;
        gamefile = new Uint8Array( buffer );
        checksum = fnv32( gamefile ).toString( 16 );
        writeGamefile();
    }

    (function () {
        var gameUrl = hugojs_options.story,
            requestUrl,
            useProxy;

        if( !gameUrl ) {
            hugoui.error( "No game file specified" );
        }

        var xmlhttp = new XMLHttpRequest();

        switch( "" + hugojs_options.use_proxy ) {
            case 'always':
            case 'true':
            case '1':
                useProxy = true;
                break;

            case 'never':
            case 'false':
            case '0':
                useProxy = false;
                break;

//          case 'auto':
            default:
                // use proxy for CORS requests
                useProxy = /^https?:\/\//.test( gameUrl ) && gameUrl.indexOf( window.location.protocol + '//' + window.location.host ) !== 0;

                // warn about invalid option
                if( hugojs_options.use_proxy !== 'auto' ) {
                    console.warn( 'Unknown use_proxy option "' + hugojs_options.use_proxy + '", using "auto"' );
                }
                break;
        }

        if( useProxy ) {
            requestUrl = hugojs_options.proxy_url.split( '%s' ).join( encodeURIComponent( gameUrl ) );
        }
        else {
            requestUrl = gameUrl;
        }

        xmlhttp.responseType = "arraybuffer";

        xmlhttp.onreadystatechange = function () {
            if( xmlhttp.readyState == XMLHttpRequest.DONE ) {
                switch( xmlhttp.status ) {
                    case 200:
                        gamefileLoaded( xmlhttp.response );
                        break;

                    case 404:
                        hugoui.error( "Game file not found" );
                        break;

                    case 415:
                        if( useProxy ) {
                            hugoui.error( String.fromCharCode.apply( null, new Uint8Array( xmlhttp.response ) ) );
                        }
                        else {
                            hugoui.error( 'Unsupported Media Type error encountered when loading game file' );
                        }
                        break;

                    case 0:     // probably cross-origin error
                        hugoui.error( "Unspecified error loading game file (possibly cross-origin restriction)" );
                        break;

                    default:
                        hugoui.error( "Error loading game file. Server returned status code " + xmlhttp.status + " (" + xmlhttp.statusText + ")" );
                        break;
                }
            }
        };

        xmlhttp.open( "GET", requestUrl, true );
        // xmlhttp.setRequestHeader( 'X-Proxy-URL', gameUrl );
        xmlhttp.send();
    })();


    /**
     * Autosave game.
     */
    hugoui.autosave = function() {
        if( !hugojs_options.autosave ) {
            return;
        }

        // save UI state
        FS.writeFile(
            autosaveFilename + '_uidata',
            JSON.stringify( hugoui.getUIState() ),
            { encoding: 'utf8' }
        );

        // trigger engine autosave
        Module.ccall(
            'hugojs_save_autosave',
            'int',
            [ 'string' ],
            [ autosaveFilename ]
        );
    };


    /**
     * The engine has written to the opcode file. See what's in it,
     * execute the opcode, and write the response (if any).
     */
    hugoui.process_opcode_file = function() {
        if( !hugojs_options.extra_opcodes ) {
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
            }
/*
            1100: function() {  // SET_COLOR
                hugoui.setCustomColor( opcodeData[ 2 ], opcodeData[ 4 ], opcodeData[ 6 ], opcodeData[ 8 ] );
            }
*/
        };

        if( opcodes[ op ] ) {
            opcodes[ op ]();
            FS.writeFile( OPCODE_CONTROL_FILE, response, { encoding: 'binary' } );
        }
    };


    /**
     * Read the UI state from the filesystem.
     */
    hugoui.readUIState = function() {
        try {
            var state = FS.readFile(
                autosaveFilename + '_uidata',
                {encoding: 'utf8'}
            );

            return JSON.parse( state );
        }
        catch(e) {
            return null;
        }
    };


    /**
     * Ask the user to provide a file name.
     *
     * @param why The reason why a file is being prompted.
     *            One of "for command recording", "for command playback",
     *            "to restore", "to save" or "to begin transcription (or printer name)"
     */
    hugoui.filePrompt = function( why ) {
        var filename = prompt( "Enter filename " + why );

        if( filename && /\S/.test( filename ) ) {
            hugoui.prompt.input.value = datadir + '/' + filename.split( '/' ).join( '-' );
        }
        else {
            hugoui.prompt.input.value = "";
        }

        // we'll have to wait for the UI to get ready before submitting the input
        setTimeout( function() {
            hugoui.prompt.form.dispatchEvent( new Event( 'submit' ) );

            // ..and another timeout to sync the filesystem.
            // We should hook to the file save itself, but this should do for now,
            // especially since this exists only as a backup measure if the
            // same thing in the onbeforeunload event fails.
            setTimeout( function() {
                FS.syncfs( false, function () {} );
            }, 1000 );
        }, 1 );
    };


    /**
     * The engine calls this when it's been initialized.
     */
    hugoui.he_ready = function() {
        interpreterLoaded = true;
        writeGamefile();
    };


    /**
     * Synchronize virtual filesystem status with IndexedDB.
     */
    hugoui.syncfs = function() {
        FS.syncfs( false, function() {} );
    };


    // store data saved by the game file
    window.onbeforeunload = function() {
        FS.syncfs( false, function() {} );
    };

    document.getElementById( 'loader-message' ).innerHTML = 'Loading interpreter and game file';

    window.hugoui = hugoui;
})( window.hugoui || {} );
