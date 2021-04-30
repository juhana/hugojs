module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true
    },
    extends: [
        "eslint:recommended"
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: "module"
    },
    globals: {
        FS: "readonly",
        IDBFS: "readonly",
        Module: "readonly"
    },
    rules: {
        "array-bracket-spacing": [ 1, "always" ],
        "comma-dangle": [ 1, "never" ],
        "eol-last": 1,
        "key-spacing": [ 1, { "afterColon": true, "beforeColon": false } ],
        "keyword-spacing": [ 1, { "before": true, "after": true, "overrides": {
            "catch": { "after": false },
            "for": { "after": false },
            "if": { "after": false },
            "switch": { "after": false },
            "while": { "after": false }
        } } ],
        "no-control-regex": 0,
        "no-debugger": 0,
        "no-trailing-spaces": 1,
        "object-curly-spacing": [ 1, "always" ],
        "quotes": 1,
        "semi": [ 1, "always" ],
        "space-before-function-paren": [ 1, "never" ],
        "space-in-parens": [ 1, "always", { "exceptions": [ "{}" ] } ]
    }
};
