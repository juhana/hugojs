import { expect, finished } from "./haven/assets";
import error from "./haven/error";

expect( "engine" );

window.Module = {
    arguments: [ "/game.hex" ],
    preRun: [],
    postRun: [ function() { finished( "engine" ); } ],
    print: function( text ) {
        // The engine should always use the custom text printing methods.
        // Anything printed to stdout is an error.
        error( "Unexpected engine output to stdout: " + text );
    },
    printErr: function() {
        console.log( arguments );
        error( Array.prototype.slice.call( arguments ).join( " " ) );
    }
};
