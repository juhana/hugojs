import { append as appendToBuffer } from "./haven/buffer";
import { start } from "./haven/haven";

import {
    getTextWasPrinted,
    setMode
} from "./haven/input";

import { get as getOption } from "./haven/options";

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


export const font = {
    /**
     * Set font styles
     *
     * @param f
     * @param hugoWindow
     */
    set: function( f, hugoWindow ) {
        setStyle( "bold", !!(f & 1), hugoWindow );
        setStyle( "italic", !!(f & 2), hugoWindow );
        setStyle( "underline", !!(f & 4), hugoWindow );
        setStyle( "proportional", !!(f & 8), hugoWindow );
        setStyle( "original", f, hugoWindow );

        // setStyle( flushedText, hugoWindow );
    }
};


/**
 * Called by the engine when the game has ended.
 */
export const gameEnded = function() {
    // delete the autosave file
    if( getOption( 'autosave' ) ) {
        autosave.remove();
    }

    // Redirect to an exit URL when the game ends.
    // A fatal error should block the redirection.
    // As a crude check for whether an error was thrown,
    // check if the error message div is present.
    if( getOption( 'exit_url' ) && !document.getElementById( 'fatal-error' ) ) {
        // if any text is printed after previous input,
        // wait for keypress/click before redirecting
        if( getTextWasPrinted() ) {
            setMode( 'endgame' );
        }
        else {
            window.location = getOption( 'exit_url' );
        }
    }
};


/**
 * Initialize HugoJS methods and start Haven
 */
export const init = function() {
    start( {
        // Hugo engine decides text and background colors
        engineColors: true,

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
    } );

    if( window.opcodes ) {
        window.opcodes.init();
    }
};


/**
 * Send the current window dimensions back to the engine.
 *
 * Called by the engine when it needs to init the display.
 */
export function initScreen() {
    const loader = document.getElementById( 'loader' );

    if( loader ) {
        loader.parentNode.removeChild( loader );
    }

    sendWindowDimensions();
};


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
    if( text === '\n' ) {
        return;
    }

    appendToBuffer( text, hugoWindow );
}


/**
 * Reset UI state after restore
 */
export function restoreUI() {
    restoreHavenUI();
}


/**
 * Send the window dimensions to the engine (Hugo only)
 */
export function sendWindowDimensions() {
    const dimensions = measureDimensions();
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
 * Sets the window title. Called by the engine.
 *
 * @param title
 */
export function setTitle( title ) {
    setWindowTitle( title );
}


// Set Emscripten's command line arguments that load the story file
window.Module.arguments = [ '/game.hex' ];