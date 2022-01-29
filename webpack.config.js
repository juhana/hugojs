const path = require( "path" );
const { CleanWebpackPlugin } = require( "clean-webpack-plugin" );
const CopyWebpackPlugin = require( "copy-webpack-plugin" );

module.exports = {
    entry: "./src/index.js",
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader"
                ]
            }
        ]
    },
    output: {
        filename: "play/hugo.js",
        path: path.resolve( __dirname, "dist" )
    },
    performance: {
        hints: false
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                { from: "**/*", to: "play", context: "assets/" },
                { from: "**/*", to: ".", context: "www/" },
                { from: "he.js", to: "play", context: "he/" },
                { from: "he.wasm", to: "play", context: "he/" }
            ]
        })
    ],
    devServer: {
        static: [ "assets", "library" ]
    }
};
