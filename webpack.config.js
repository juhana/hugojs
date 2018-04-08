const path = require( "path" );
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    devtool: 'inline-source-map',
    entry: "./src/index.js",
    mode: "development",
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
    performance : {
        hints : false
    },
    plugins: [
        new CleanWebpackPlugin([ "dist" ]),
        new CopyWebpackPlugin([
            { from: "assets/*", to: "play", flatten: true },
            { from: "www/*", to: ".", flatten: true }
        ])
    ]
};