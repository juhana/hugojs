import { expect, finished } from "./haven/assets";
import error from "./haven/error";

expect( "engine" );

export interface EmscriptenModule {
    arguments: string[];
    ccall: ( ident: string, returnType: string, argTypes: string[], args: ( number | string | boolean )[] ) => void | string | number | boolean;
    preRun: ( () => void )[];
    postRun: ( () => void )[];
    print: ( text: string ) => void;
    printErr: ( args: unknown[] ) => void;
}

export const emscriptenModule: Partial<EmscriptenModule> = {
    arguments: [ "/game.hex" ],
    preRun: [],
    postRun: [ (): void => finished( "engine" ) ],
    print: ( text: string ): void => {
        // The engine should always use the custom text printing methods.
        // Anything printed to stdout is an error.
        error( "Unexpected engine output to stdout: " + text );
    },
    printErr: ( ...args: unknown[] ): void => {
        console.log( args );
        error( Array.prototype.slice.call( args ).join( " " ) );
    }
};
