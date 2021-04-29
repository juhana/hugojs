const path = require( "path" );
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')

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
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [ '@babel/preset-env' ],
                        sourceRoot: '../'
                    }
                }
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
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                { from: "**/*", to: "play", context: "assets/" },
                { from: "**/*", to: ".", context: "www/" }
            ]
        })
    ]
};