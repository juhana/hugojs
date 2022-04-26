const path = require( "path" );
const { CleanWebpackPlugin } = require( "clean-webpack-plugin" );
const CopyWebpackPlugin = require( "copy-webpack-plugin" );

module.exports = {
    entry: "./src/index.ts",
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader"
                ]
            },
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },
    output: {
        filename: "hugo.js",
        path: path.resolve( __dirname, "dist/play" )
    },
    resolve: {
        extensions: [ ".ts", ".js" ]
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
