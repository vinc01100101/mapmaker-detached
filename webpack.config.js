const path = require("path");

module.exports = {
    mode: "development",
    entry: {
        gate: ["./client-src-unbundled/MapMaker.js"],
    },
    output: {
        path: path.join(__dirname, "dist"),
        filename: `[name].js`,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env"],
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        alias: {},
    },
    plugins: [],
};
