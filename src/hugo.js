import { append as appendToBuffer } from "./haven/buffer";
import { start } from "./haven/haven";
import { prompt } from "./haven/file";

import {
    getTextWasPrinted,
    keypress,
    setMode
} from "./haven/input";

import {
    get as getOption,
    getParameter,
    set as setOption
} from "./haven/options";

import {
    show as showPrompt,
    waitLine as promptWaitLine
} from "./haven/prompt";

import {
    autosave,
    restoreUI as restoreHavenUI
} from "./haven/state";

import {
    color as colors,
    set as setStyle
} from "./haven/style";

import {
    clear as clearWindow,
    measureDimensions,
    position as windowPosition,
    setTitle as setWindowTitle
} from "./haven/window";

import * as _opcodes from "./opcodes";

export const opcodes = _opcodes;


/**
 * Clear target window, or if omitted, the entire screen.
 *
 * @param hugoWindow
 */
export function clear( hugoWindow ) {
    clearWindow( hugoWindow );
}


export const color = {
    /**
     * Set colors in windows
     *
     * @param which
     * @param newColor
     * @param hugoWindow
     */
    set: function( which, newColor, hugoWindow ) {
        colors.set( which, newColor, hugoWindow );
    }
};


/**
 * Save/restore prompts
 */
export function filePrompt( why ) {
    return prompt( why );
}


export const font = {
    /**
     * Set font styles
     *
     * @param f
     * @param hugoWindow
     */
    set: function( f, hugoWindow ) {
        setStyle( "bold", !!( f & 1 ), hugoWindow );
        setStyle( "italic", !!( f & 2 ), hugoWindow );
        setStyle( "underline", !!( f & 4 ), hugoWindow );
        setStyle( "proportional", !!( f & 8 ), hugoWindow );
        setStyle( "original", f, hugoWindow );

        // setStyle( flushedText, hugoWindow );
    }
};


/**
 * Called by the engine when the game has ended.
 */
export function gameEnded() {
    // delete the autosave file
    if( getOption( "autosave" ) ) {
        autosave.remove();
    }

    // Redirect to an exit URL when the game ends.
    // A fatal error should block the redirection.
    // As a crude check for whether an error was thrown,
    // check if the error message div is present.
    if( getOption( "exit_url" ) && !document.getElementById( "fatal-error" ) ) {
        // if any text is printed after previous input,
        // wait for keypress/click before redirecting
        if( getTextWasPrinted() ) {
            setMode( "endgame" );
        }
        else {
            window.location = getOption( "exit_url" );
        }
    }
}


/**
 * Initialize HugoJS methods and start Haven
 */
export function init() {
    const options = window.hugojs_options || {};

    const ready = function() {
        start({
            // name the main container
            container: "#hugo",

            // Hugo engine decides text and background colors
            engineColors: true,

            // the Hugo engine will handle printing the prompt,
            // as opposed to Vorple that uses a custom prompt
            enginePrompt: true,

            // let the Hugo engine set the font family
            // (fixed width or proportional)
            engineFontFamily: true,

            // user-provided options
            options,

            // no Unicode support
            unicode: false,

            // the name of the story file in the virtual filesystem
            virtualStoryfile: "game.hex"
        });

        opcodes.init();
    };

    // let the user upload a game file unless one is already supplied
    // and it's not been explicitly disallowed
    if( options.allow_upload && !options.lock_story && !getParameter( "story" ) ) {
        const uploadContainer = document.createElement( "div" );
        const header = document.createElement( "h2" );
        const fileUpload = document.createElement( "input" );

        uploadContainer.id = "uploadContainer";
        header.textContent = "Upload Hugo story file (.hex)";

        fileUpload.type = "file";
        fileUpload.addEventListener( "change", function() {
            setOption( "uploadedFile", this.files[ 0 ] );
            ready();
        });

        document.getElementById( "loader" ).style.display = "none";
        uploadContainer.appendChild( header );
        uploadContainer.appendChild( fileUpload );
        document.body.appendChild( uploadContainer );
    }
    else {
        ready();
    }

}

function removeLoader() {
    const loader = document.getElementById( "loader" );

    if( loader ) {
        loader.parentNode.removeChild( loader );
    }
}

/**
 * Send the current window dimensions back to the engine.
 *
 * Called by the engine when it needs to init the display.
 */
export function initScreen() {
    removeLoader();
    sendWindowDimensions();
}


/**
 * Set the print cursor position.
 */
export const position = {
    set: function( column, line, hugoWindow ) {
        windowPosition.set( column, line, hugoWindow );
    }
};


/**
 * Print text.
 *
 * @param text
 * @param hugoWindow
 */
export function print( text, hugoWindow ) {
    // \n is a carriage return, not needed in the browser environment
    if( text === "\n" ) {
        return;
    }

    appendToBuffer( text, hugoWindow );
}


/**
 * Reset UI state after restore
 */
export function restoreUI() {
    return restoreHavenUI();
}


/**
 * Send the window dimensions to the engine (Hugo only)
 */
export function sendWindowDimensions() {
    const dimensions = measureDimensions();

    Module.ccall(
        "hugo_set_window_dimensions",
        "null",
        [ "number", "number", "number", "number", "number", "number" ],
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
 */
export function setTitle( title ) {
    return setWindowTitle( title );
}


/**
 * Starts waiting for a keypress
 */
export function waitKeypress() {
    return keypress.wait();
}


/**
 * Returns a promise that resolves when the player presses a key
 */
export function waitKeypressPromise() {
    return keypress.waitPromise();
}


/**
 * Starts waiting for line input
 */
export function waitLine() {
    showPrompt();
    return promptWaitLine();
}


// Set Emscripten's command line arguments that load the story file
Module.arguments = [ "/game.hex" ];
