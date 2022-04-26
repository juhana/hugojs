/* eslint-disable @typescript-eslint/no-explicit-any */
import { EmscriptenModule, emscriptenModule } from "./bootstrap";
import * as ui from "./hugo";

export interface HugoJsOptions {
    allow_upload?: boolean;
    autosave?: boolean;
    exit_url?: string | false | null;
    lock_options?: boolean;
    lock_story?: boolean;
    proxy_url?: string | false | null;
    story?: string;
    use_proxy?: "auto" | "always" | "never";
    windowing?: boolean;
}

declare global {
    interface Window {
        _haven_start(): void;
        FS: any;
        hugojs_options?: HugoJsOptions;
        hugoui: typeof ui;
        IDBFS: any;
        Module: EmscriptenModule;
    }
}

window.hugoui = ui;
window.Module = emscriptenModule as EmscriptenModule;
