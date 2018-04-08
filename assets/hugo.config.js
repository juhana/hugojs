window.hugojs_options = {
    // URL to the game file
    story: "",

    // is autosave enabled?
    autosave: true,

    // the URL where the browser is redirected when the story ends
    exit_url: "../",

    // disallow supplying options in the URL (except story file)?
    lock_options: false,

    // disallow supplying the story file in the URL?
    lock_story: false,

    // URL to the CORS proxy script for loading cross-origin game files.
    // %s is replaced by the requested game file's URL.
    proxy_url: "https://proxy.iplayif.com/proxy/?url=%s",

    // use a CORS proxy to load game files?
    // "always" (or true), "never" (or false), or "auto".
    // The "auto" option uses proxy only if the story URL points to another domain.
    use_proxy: "auto",

    // Setting windowing to false will disable all windows except the main window.
    // In practice it means that the status line won't be shown.
    // Useful if the status line is buggy but the game is otherwise playable.
    windowing: true
};

hugoui.init();