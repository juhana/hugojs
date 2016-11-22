window.Module = {
    arguments: [ '/game.hex' ],
    preRun: [],
    postRun: [ hugoui.he_ready ],
    print: function( text ) {
        // The engine should always use the custom hugoui text printing methods.
        // Anything printed to stdout is an error.
        hugoui.error( text );
    },
    printErr: function() {
        console.log( arguments );
        hugoui.error( Array.prototype.slice.call(arguments).join(' ') );
    }
};

