const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

//routes
const routes = require("./server-modules/routes");

//auth
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

//misc
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

app.use(express.static(__dirname + "/dist", { index: false }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.text());

//view engine
app.set("view engine", "pug");

const port = process.env.PORT || 8080;
const devRecompileEnabled = true;

if (devRecompileEnabled) {
    const webpack = require("webpack");
    const webpackDevMiddleware = require("webpack-dev-middleware");
    const config = require("./webpack.config.js");

    //Add HMR plugin
    //  Hot Module Replacement (HMR) exchanges, adds, or removes modules
    //  while an application is running, without a full reload.
    //  This can significantly speed up development in a few ways:

    //  -Retain application state which is lost during a full reload.
    //  -Save valuable development time by only updating what's changed.
    //  -Instantly update the browser when modifications are made to CSS/JS in the source code, which is almost comparable to changing styles directly in the browser's dev tools.

    config.plugins.push(new webpack.HotModuleReplacementPlugin());

    const compiler = webpack(config);

    //Enable "webpack-dev-middleware"
    //  Some of the benefits of using this middleware include:
    //  -No files are written to disk, rather it handles files in memory
    //  -If files changed in watch mode, the middleware delays requests until compiling has completed.
    //  -Supports hot module reload (HMR).

    app.use(
        webpackDevMiddleware(compiler, {
            publicPath: config.output.publicPath,
        })
    );
}

//SET MAP STASH SCHEMA
const mapstash = new mongoose.Schema({
    set: String,
    mapStashNames: [],
    mapStashName: {
        type: String,
        lowercase: true,
    },
    key: { type: String },
    maps: {},
});
mapstash.pre("save", () => console.log("Hello from mapStash pre save"));
mapstash.post("save", () => console.log("Hello from mapStash post save"));

mapstash.plugin(uniqueValidator);
const MapStashModel = mongoose.model("unnamedrpg_mapstash", mapstash);

//database
const dbUri = process.env.DB;
mongoose.connect(
    dbUri,
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
    (err, db) => {
        if (err) return console.log("Error connecting to DB: " + err);
        console.log("Connected to DB");

        function createDataIfNotExistingYet(data) {
            //create sets of data set references if not existing yet

            data.Model.findOne({ set: data.ref }, (err, doc) => {
                if (err)
                    return console.log(
                        "Error creating " + data.ref + " ref. " + err
                    );
                if (!doc) {
                    const newDoc = new data.Model({
                        set: data.ref,
                        [data.ref]: { "": "" },
                    });

                    newDoc.save((er, saved) => {
                        if (er)
                            return console.log(
                                "Error while saving " + data.ref + " ref. " + er
                            );
                        if (saved) {
                            console.log(
                                "Set: " +
                                    data.ref +
                                    " ref. successfully created."
                            );
                        } else {
                            console.log(
                                "Set: " + data.ref + " ref. creation failed."
                            );
                        }
                    });
                }
            });
        }

        createDataIfNotExistingYet({
            Model: MapStashModel,
            ref: "mapStashNames",
        });

        routes(app, MapStashModel);
    }
);

http.listen(port, () => {
    console.log("listening to port: " + port);
});
