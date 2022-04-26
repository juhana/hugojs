import "custom-event-polyfill";

import { addCallback, finished } from "./haven/assets";
import error from "./haven/error";
import { syncfs } from "./haven/file";
import { keypress } from "./haven/input";
import { get } from "./haven/options";
import { autosave } from "./haven/state";

const interpreterLoaded = false;
let isGamefileLoaded = false;
let gamefile: Uint8Array;
let checksum: string;
let datadir: string;
let storyFilename: string;

/**
 * FNV32-algorithm to calculate the story file's checksum.
 * The checksum is used to name the directories for save games.
 *
 * Taken from https://codepen.io/ImagineProgramming/post/checksum-algorithms-in-javascript-checksum-js-engine
 */
const fnv32 = ( a: Uint8Array ): number => {
    const len = a.length;
    let fnv = 0;

    for( let i = 0; i < len; i++ ) {
        fnv = ( fnv + ( ( ( fnv << 1 ) + ( fnv << 4 ) + ( fnv << 7 ) + ( fnv << 8 ) + ( fnv << 24 ) ) >>> 0 ) ) ^ ( a[ i ] & 0xff );
    }

    return fnv >>> 0;
};


/**
 * Start loading the story file.
 */
export const loadStoryFile = ( virtualFilename: string ): Promise<number[]> => {
    return new Promise( ( resolve ) => {
        const gameUrl = get( "story" );
        const uploadedFile = get( "uploadedFile" );
        const proxyOption = get( "use_proxy" );
        let requestUrl;
        let useProxy;

        storyFilename = virtualFilename;

        const processStoryFile = ( file: ArrayBuffer ): void => {
            isGamefileLoaded = true;
            gamefile = new Uint8Array( file );
            checksum = fnv32( gamefile ).toString( 16 );

            // signal that the story file is ready
            finished( "storyfile" );

            resolve( Array.from( gamefile ) );
        };

        // if the user has uploaded a file, process that instead of loading from a URL
        if( uploadedFile ) {
            const reader = new FileReader();

            reader.onload = ( e ): void => {
                const uploadContainer = document.getElementById( "upload-container" );

                if( uploadContainer ) {
                    uploadContainer.parentNode?.removeChild( uploadContainer );
                }

                if( !e.target?.result ) {
                    error( "Error loading story file" );
                    return;
                }

                processStoryFile( e.target.result as ArrayBuffer );
            };

            addCallback( writeGamefile );
            reader.readAsArrayBuffer( uploadedFile );

            return;
        }
        else if( !gameUrl ) {
            error( "No story file specified" );
            return;
        }

        const xmlhttp = new XMLHttpRequest();

        switch( "" + proxyOption ) {
            case "always":
            case "true":
            case "1":
                useProxy = true;
                break;

            case "never":
            case "false":
            case "0":
                useProxy = false;
                break;

                //      case 'auto':
            default:
                // use proxy for CORS requests
                useProxy = /^https?:\/\//.test( gameUrl ) && gameUrl.indexOf( window.location.protocol + "//" + window.location.host ) !== 0;

                // warn about invalid option
                if( proxyOption !== "auto" ) {
                    console.warn( "Unknown use_proxy option \"" + proxyOption + "\", using \"auto\"" );
                }
                break;
        }

        if( useProxy ) {
            requestUrl = get( "proxy_url" ).split( "%s" ).join( encodeURIComponent( gameUrl ) );
        }
        else {
            requestUrl = gameUrl;
        }

        addCallback( writeGamefile );

        xmlhttp.onreadystatechange = (): void => {
            if( xmlhttp.readyState == XMLHttpRequest.DONE ) {
                switch( xmlhttp.status ) {
                    case 200:
                        processStoryFile( xmlhttp.response );
                        break;

                    case 404:
                        error( "Game file not found" );
                        break;

                    case 415:
                        if( useProxy ) {
                            error( String.fromCharCode.apply( null, Array.from( new Uint8Array( xmlhttp.response ) ) ) );
                        }
                        else {
                            error( "Unsupported Media Type error encountered when loading game file" );
                        }
                        break;

                    case 0:     // probably cross-origin error
                        error( "Unspecified error loading game file (possibly cross-origin restriction)" );
                        break;

                    default:
                        error( "Error loading game file. Server returned status code " + xmlhttp.status + " (" + xmlhttp.statusText + ")" );
                        break;
                }
            }
        };

        xmlhttp.open( "GET", requestUrl, true );
        xmlhttp.responseType = "arraybuffer";
        xmlhttp.send();
    });
};


/**
 * Writes the loaded game file into the virtual file system, but only
 * if both the interpreter and the game file are both loaded.
 *
 * @returns {boolean} true when all required assets have finished loading
 */
const writeGamefile = (): Promise<void> => {
    const { FS, IDBFS } = window;

    // re-show loader if hidden
    const loaderElement = document.getElementById( "loader" );
    const loaderMessageElement = document.getElementById( "loader-message" );

    if( loaderElement ) {
        loaderElement.style.display = "block";
    }

    if( loaderMessageElement ) {
        if( ( !interpreterLoaded || !isGamefileLoaded ) ) {
            loaderMessageElement.innerHTML = interpreterLoaded ? "Loading game file" : "Loading interpreter";
        }

        loaderMessageElement.innerHTML = "Starting game";
    }

    FS.writeFile(
        storyFilename,
        gamefile,
        { encoding: "binary" }
    );

    // create the virtual savefile directory if it doesn't exist
    datadir = "/gamedata_" + checksum;

    if( !FS.analyzePath( datadir ).exists ) {
        FS.mkdir( datadir );
    }

    FS.mount( IDBFS, { root: "." }, datadir );

    // create a directory for shared game data
    if( !FS.analyzePath( "gamedata" ).exists ) {
        FS.mkdir( "gamedata" );
    }

    FS.mount( IDBFS, { root: "." }, "gamedata" );
    FS.chdir( "gamedata" );

    return new Promise( ( resolve ) => {
        // synchronize with local data
        syncfs( true, function() {
            if( get( "autosave" ) ) {
                autosave.setName( "/gamedata_" + checksum + "/autosave" );
                autosave.restore();
            }

            // start reacting to keypresses
            keypress.init();

            resolve();
        });
    });
};

