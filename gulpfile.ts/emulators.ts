import * as fs from "fs";

import { src, dest, series, parallel } from "gulp";
import del from "del";

import sourcemaps from "gulp-sourcemaps";
import terser from "gulp-terser";
import size from "gulp-size";
import browserify from "browserify";
import buffer from "vinyl-buffer";
import source from "vinyl-source-stream";
import replace from "gulp-replace";

// eslint-disable-next-line
const tsify = require("tsify");
// eslint-disable-next-line
const footer = require("gulp-footer");
const header = require("gulp-header");

function clean() {
    return del(["dist/emulators*",
        "build/wworker-footer*"], { force: true });
}

function js() {
    return browserify({
        debug: true,
        entries: ["src/emulators.ts"],
        cache: {},
        packageCache: {},
    })
        .plugin(tsify, {
            "target": "esnext",
        })
        .transform("babelify", {
            presets: [["@babel/preset-env", {
                "useBuiltIns": "usage",
                "corejs": 3,
            }]],
            extensions: [".ts"],
        })
        .bundle()
        .pipe(source("emulators.js"))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(terser())
        .pipe(sourcemaps.write("./"))
        .pipe(size({ showFiles: true, showTotal: false }))
        .pipe(dest("dist"));
}

const head=`

const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

if (isNode) {
    const { isMainThread } = require('node:worker_threads');
    if (isMainThread) {
        console.log("main")
    }
    else {
        const { parentPort } = require('node:worker_threads');
        var self = parentPort;
        var worker=parentPort;
        function importScripts(...args) {
            console.log(args)
        }
        var onmessage=function (e){

        }
        parentPort.on('message', (message) => {
            onmessage({data:message})
            console.log('Received from main:', message);
        });
        function postMessage(msg){
            parentPort.postMessage(msg);
        }
    }
}
`

function dosboxJs() {
    return src("dist/wdosbox.js")
        .pipe(header(head))
        .pipe(footer(fs.readFileSync("src/dos/dosbox/ts/worker-server.js")))
        .pipe(replace("@MODULE_NAME@", "WDOSBOX"))
        .pipe(dest("dist"));
}

function dosboxxJs() {
    return src("dist/wdosbox-x.js")
        .pipe(header(head))
        .pipe(footer(fs.readFileSync("src/dos/dosbox/ts/worker-server.js")))
        .pipe(replace("@MODULE_NAME@", "WDOSBOXX"))
        .pipe(dest("dist"));
}

export const compileJs = series(clean, js);
export const emulators = parallel(dosboxJs, dosboxxJs);
