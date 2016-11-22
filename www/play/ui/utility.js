(function( hugoui ) {
    "use strict";

    /**
     * Parse a GET parameter.
     *
     * @param name
     * @param type
     * @param defaultValue
     */
    function getParameter( name, type, defaultValue ) {
        var valueSearch = new RegExp( '[?&]' + name + '=(.*?)(#|&|$)', 'i' ).exec( window.location.href ),
            value;

        if( valueSearch === null || valueSearch.length < 2 ) {
            return defaultValue;
        }

        value = decodeURIComponent( valueSearch[ 1 ].split( '+' ).join( ' ' ) );

        switch( type ) {
            case 'boolean':
                if( value.toLowerCase() === 'true' || value === 'on' || value === '1' ) {
                    return true;
                }

                if( value.toLowerCase() === 'false' || value === 'off' || value === '0' ) {
                    return false;
                }

                return defaultValue;

            case 'number':
                if( parseFloat( value ) + "" === value ) {
                    return parseFloat( value );
                }

                return NaN;

            default:
                if( value.length === 0 ) {
                    return defaultValue;
                }

                return value;
        }
    }


    /**
     * Show an error message and halt.
     */
    hugoui.error = function( message ) {
        var elem = document.createElement( 'div' ),
            spinner = document.getElementById( 'spinner' ),
            loader = document.getElementById( 'loader' );

        elem.id = 'fatal-error';
        elem.innerHTML = message;
        document.body.appendChild( elem );

        // remove spinner animation if error happened on load
        if( spinner ) {
            spinner.parentNode.removeChild( spinner );
        }

        // visual notification that loading has stopped
        if( loader ) {
            loader.className = 'stopped';
        }

        throw new Error( message );
    };


    // Read the settings object
    window.hugojs_options = window.hugojs_options || {};

    var option_defaults = {
            autosave: true,
            exit_url: '',
            proxy_url: 'proxy.php',
            use_proxy: 'auto',
            windowing: true
        },
        option_key;

    for( option_key in option_defaults ) {
        if( option_defaults.hasOwnProperty( option_key ) && hugojs_options[ option_key ] === undefined ) {
            hugojs_options[ option_key ] = option_defaults[ option_key ];
        }
    }

    if( !hugojs_options.lock_story ) {
        hugojs_options.story = getParameter( 'story', 'string', hugojs_options.story );
    }

    if( !hugojs_options.lock_options ) {
        for( option_key in option_defaults ) {
            if( option_key !== 'story' && option_defaults.hasOwnProperty( option_key ) ) {
                hugojs_options[ option_key ] = getParameter( option_key, typeof option_defaults[ option_key ], hugojs_options[ option_key ] );
            }
        }

        // special cases
        if( hugojs_options.exit_url === 'false' || hugojs_options.exit_url === '0' ) {
            hugojs_options.exit_url = false;
        }
    }

    /**
     * fastclick.js initializer - fixes tapping issues in mobile browsers
     */
    if( 'addEventListener' in document ) {
        document.addEventListener( 'DOMContentLoaded', function() {
            FastClick.attach( document.body );
        }, false );
    }

    window.hugoui = hugoui;
})( window.hugoui || {} );
