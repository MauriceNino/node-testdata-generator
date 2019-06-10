"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var modelInput_1 = require("./models/modelInput");
var worker_1 = require("./core/worker");
var cmdOpts = process.argv;
var nodePath = cmdOpts[0];
var indexPath = cmdOpts[1];
var args = cmdOpts.slice(2);
function main(args) {
    if (args.length == 0) {
        throw new Error("There needs to be at least 1 parameter for this to work!");
    }
    var opts = new modelInput_1.CmdOpts();
    args.forEach(function (arg) {
        var argArr = arg.replace(/^-+/g, '').split('=');
        if (argArr.length > 2) {
            throw new Error("Argument '" + arg + "' has too many values. Type node 'index.js --help' for help about commands!");
        }
        var handleArg = modelInput_1.argsHandler.find(function (a) { return a.aliases.indexOf(argArr[0]) !== -1; });
        if (handleArg === undefined) {
            throw new Error("Argument '" + arg + "' does not exist. Type node 'index.js --help' for help about commands!");
        }
        if (argArr.length == 2) {
            handleArg.addFlag(opts, argArr[1]);
        }
        else {
            handleArg.addFlag(opts, '');
        }
    });
    if (opts.createTemplate && (opts.writeToDatabase || opts.outputFilename != null)) {
        throw new Error("You cant write a templete file while writing an output file or connecting to the database!");
    }
    if (opts.writeToDatabase && (opts.databaseHost === undefined || opts.databasePort === undefined)) {
        throw new Error("You cant write a templete file and an output file simultaniously!");
    }
    worker_1.NodeTestdataGenerator.cmdDoWork(opts);
}
main(args);
