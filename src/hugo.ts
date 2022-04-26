import { append as appendToBuffer, flush } from "./haven/buffer";
import { start } from "./haven/haven";
import { getIsTextPrinted, keypress, setMode } from "./haven/input";
import { get as getOption, getParameter, set as setOption } from "./haven/options";
import { expectInput, setEngineInputFunction } from "./haven/prompt";
import { autosave, restoreUI as restoreHavenUI } from "./haven/state";
import { color as colors, set as setStyle } from "./haven/style";
import {
    clear as clearWindow,
    measureDimensions,
    position as windowPosition,
    setTitle as setWindowTitle
} from "./haven/window";

import { loadStoryFile } from "./file";
import * as _opcodes from "./opcodes";

import type { HugoJsOptions } from "./index";

export const opcodes = _opcodes;


/**
 * Clear target window, or if omitted, the entire screen.
 */
export const clear = ( hugoWindow: number ): void => {
    clearWindow( hugoWindow );
};


export const color = {
    /**
     * Set colors in windows
     */
    set: ( which: number, newColor: number, hugoWindow: number ): void => {
        colors.set( which, newColor, hugoWindow );
    }
};


/**
 * Save/restore prompts
 */
export const filePrompt = ( why: "save" | "restore" ): void => {
    appendToBuffer( `Enter filename to ${why}: ` );
    flush();
};


export const font = {
    /**
     * Set font styles
     */
    set: ( f: number, hugoWindow: number ): void => {
        setStyle( "bold", !!( f & 1 ), hugoWindow );
        setStyle( "italic", !!( f & 2 ), hugoWindow );
        setStyle( "underline", !!( f & 4 ), hugoWindow );
        setStyle( "proportional", !!( f & 8 ), hugoWindow );
        setStyle( "original", f, hugoWindow );
    }
};


/**
 * Called by the engine when the game has ended.
 */
export const gameEnded = (): void => {
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
        if( getIsTextPrinted() ) {
            setMode( "endgame" );
        }
        else {
            window.location = getOption( "exit_url" );
        }
    }
};


/**
 * Initialize HugoJS methods and start Haven
 */
export const init = (): void => {
    const options: HugoJsOptions = {
        allow_upload: true,
        autosave: true,
        exit_url: false,
        lock_options: false,
        lock_story: false,
        proxy_url: "https://proxy.iplayif.com/proxy/?url=%s",
        story: "",
        use_proxy: "auto",
        windowing: true,
        ...window.hugojs_options
    };

    const ready = (): void => {
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

            // story file loader
            loadStoryFile,

            // user-provided options
            options,

            // callback that starts the interpreter engine
            startEngine: () => window._haven_start(),

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
        const loaderElement = document.getElementById( "loader" );

        uploadContainer.id = "upload-container";
        header.textContent = "Upload Hugo story file (.hex)";

        fileUpload.type = "file";
        fileUpload.addEventListener( "change", function() {
            if( Array.isArray( this.files ) && this.files.length > 0 ) {
                setOption( "uploadedFile", this.files[ 0 ] );
                ready();
            }
        });

        if( loaderElement ) {
            loaderElement.style.display = "none";
        }

        uploadContainer.appendChild( header );
        uploadContainer.appendChild( fileUpload );
        document.body.appendChild( uploadContainer );
    }
    else {
        ready();
    }
};


/**
 * Removes the initial loader screen.
 */
const removeLoader = (): void => {
    const loader = document.getElementById( "loader" );

    if( loader ) {
        loader.parentNode?.removeChild( loader );
    }
};


/**
 * Send the current window dimensions back to the engine.
 *
 * Called by the engine when it needs to init the display.
 */
export const initScreen = (): void => {
    removeLoader();
    sendWindowDimensions();
};


/**
 * Set the print cursor position.
 */
export const position = {
    set: ( column: number, line: number, hugoWindow: number ): void => {
        windowPosition.set( column, line, hugoWindow );
    }
};


/**
 * Print text.
 */
export const print = ( text: string, hugoWindow: number ): void => {
    // \n is a carriage return, not needed in the browser environment
    if( text === "\n" ) {
        return;
    }

    appendToBuffer( text, hugoWindow );
};


/**
 * Reset UI state after restore
 */
export const restoreUI = (): void => {
    restoreHavenUI();
};


/**
 * Send the window dimensions to the engine
 */
export const sendWindowDimensions = (): void => {
    const dimensions = measureDimensions();

    window.Module.ccall(
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
};


/**
 * Sets the window title. Called by the engine.
 */
export const setTitle = ( title: string ): void => {
    setWindowTitle( title );
};


/**
 * Starts waiting for a keypress
 */
export const waitKeypress = (): void => {
    keypress.wait();
};


/**
 * Returns a promise that resolves when the player presses a key
 */
export const waitKeypressPromise = (): void => {
    return keypress.waitPromise();
};


/**
 * Starts waiting for line input
 */
export const waitLine = (): Promise<string> => {
    expectInput();

    return new Promise( ( resolve ) => {
        setEngineInputFunction( ( input: string ) => resolve( input + "\n" ) );     // Hugo expects a newline at the end of every command
    });
};
