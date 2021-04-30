/**
 * Support for non-standard opcodes.
 */

import { addCallback } from "./haven/assets";
import { get as getOption } from "./haven/options";
import { syncfs } from "./file";

const OPCODE_CONTROL_FILE = "HrCtlAPI";
const OPCODE_CHECK_FILE = "HrCheck";


/**
 * Save the virtual file that tells the game file we support extra opcodes.
 */
export function init() {
    addCallback( function( done ) {
        syncfs( true, function() {
            if( getOption( "extra_opcodes" ) ) {
                FS.writeFile(
                    OPCODE_CHECK_FILE,
                    new Uint8Array( [ 66, 66 ] )   // == 16962
                );
            }
            else {
                try {
                    FS.unlink( OPCODE_CHECK_FILE );
                }
                catch( e ) {
                    // do nothing
                }
            }

            try {
                FS.unlink( OPCODE_CONTROL_FILE );
            }
            catch( e ) {
                    // do nothing
            }

            syncfs( false, done );
        });
    });
}

/**
 * The engine has written to the opcode file. See what's in it,
 * execute the opcode, and write the response (if any).
 */
export function process() {
    if( !getOption( "extra_opcodes" ) ) {
        return;
    }

    const opcodeData = FS.readFile( OPCODE_CONTROL_FILE );
    const paramcount = opcodeData.length / 2 - 1;
    const response = [];

    const addResponse = function( value ) {
        response.push( value % 256 );
        response.push( value >> 8 );
    };

    const readWord = function( index ) {
        return opcodeData[ index * 2 ] + opcodeData[ index * 2 + 1 ] * 256;
    };

    const writeResponse = function() {
        FS.writeFile( OPCODE_CONTROL_FILE, new Uint8Array( response ) );
    };

    // odd number of bytes in the input, should never happen
    if( opcodeData.length % 2 === 1 ) {
        addResponse( 20 );  // 20: RESULT_WRONG_BYTE_COUNT
        writeResponse();
        return;
    }

    const opcodes = {
        1: function() {     // IS_OPCODE_AVAILABLE
            if( opcodes[ readWord( 1 ) ] ) {
                addResponse( 1 );
            }
            else {
                addResponse( 1 );
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
            throw new Error( "Abort opcode called" );
        },

        500: function() {   // OPEN_URL
            const url = Module.ccall(
                "hugojs_get_dictionary_word",
                "string",
                [ "int" ],
                [ opcodeData[ 2 ] + opcodeData[ 3 ] * 256 ]
            );

            if( confirm( "Game wants to open web address " + url + ". Continue?" ) ) {
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

    // all non-zero parameter counts
    const paramCounts = {
        1: 1,
        400: 4,
        500: 1,
        600: 1,
        700: 1,
        1100: 4,
        1600: 2
    };

    const op = readWord( 0 );

    if( opcodes[ op ] ) {
        const requiredParams = paramCounts[ op ] || 0;

        // check that the parameter count is correct
        if( paramcount !== requiredParams ) {
            addResponse( 10 );
            writeResponse();
            return;
        }

        // execute the opcode
        addResponse( 0 );   // 0: RESULT_OK
        opcodes[ op ]();
    }
    else {
        // unknown opcode or no support
        addResponse( 30 );  // 30: UNRECOGNIZED_OPCODE
        addResponse( op );
        addResponse( paramcount );

        for( let i = 1; i < paramcount; ++i ) {
            addResponse( readWord( i ) );
        }
    }

    // write the response to the control file
    writeResponse();
}
