"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var modelInput_1 = require("../models/modelInput");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var util_1 = __importDefault(require("util"));
var generator_1 = require("../generator/generator");
var transformator_1 = require("../transformator/transformator");
var Worker = /** @class */ (function () {
    function Worker() {
    }
    Worker.doWork = function (opts) {
        if (opts.printHelp)
            Worker.printHelp();
        else if (opts.createTemplate)
            Worker.writeTemplateToFile(opts.outputFilename);
        else {
            var collectionDescriptions = JSON.parse(Worker.readData(opts.schemaFile));
            if (collectionDescriptions.length == 0)
                Worker.printOutput("warn", "Input file is empty!");
            var generatedCollections = Worker.parseCollectionDescriptions(collectionDescriptions);
            var outputArr = void 0;
            switch (opts.outputFormat) {
                case "json":
                    outputArr = JSON.stringify(generatedCollections).split("\n");
                    break;
                case "sql":
                    throw new Error("Not yet implemented");
                    break;
                case "mongodb":
                    outputArr = transformator_1.Transformator.transformToMongo(generatedCollections, 3);
                    break;
                default:
                    throw new Error("Output format '" + opts.outputFormat + "' is not allowed. Check '--help' for help");
            }
            if (opts.outputType == "cmd" && opts.outputFormat == "json") {
                console.log(util_1.default.inspect(generatedCollections, false, null, true));
            }
            else {
                switch (opts.outputType) {
                    case "cmd":
                        //console.log(util.inspect(generatedCollections, false, null, true));
                        outputArr.forEach(function (el) { return console.log(el); });
                        break;
                    case "file":
                        Worker.writeToFile(opts.outputFilename, outputArr.join(""));
                        break;
                    default:
                        throw new Error("Output Type '" + opts.outputType + "' is not allowed. Check '--help' for help");
                }
            }
        }
    };
    Worker.parseCollectionDescriptions = function (collectionDescriptions) {
        var resultCollections = [];
        collectionDescriptions.forEach(function (collectionDescription) {
            resultCollections.push(generator_1.Generator.generateCollection(collectionDescription));
        });
        return resultCollections;
    };
    Worker.writeTemplateToFile = function (fileName) {
        var template = "[\n    {\n        \"databaseName\": \"db\",\n        \"collectionName\": \"test\",\n        \"size\": 100,\n        \"documentDescription\": {\n            \"testDocField\": {\n                \"type\": \"string\",\n                \"nullPercentage\": 0,\n                \"id\": 0,\n                \"lengthFrom\": 0,\n                \"lengthTo\": 10\n            }\n        }\n    }\n]";
        fs_1.default.writeFileSync(fileName, template);
        Worker.printOutput("output", "Template written to file");
    };
    Worker.writeToFile = function (fileName, content) {
        fs_1.default.writeFileSync(fileName, content);
        Worker.printOutput("output", "Content written to file");
    };
    Worker.createFile = function (fileName) {
        return fs_1.default.openSync(fileName, 'w');
    };
    Worker.readData = function (fileName) {
        var buffer = fs_1.default.readFileSync(path_1.default.join(process.cwd(), fileName));
        return buffer.toString();
    };
    Worker.printHelp = function () {
        console.log("[ \u001B[33mBasic Usage\u001B[0m ]");
        console.log("  \u001B[32mindex.js --createTemplate --fileName=template.json\u001B[0m         Generates basic template and writes it to template.json");
        console.log("  \u001B[32mindex.js --schema=template.json --of=JSON --f=result.json\u001B[0m  Generates test data from template.json and writes it to result.json in JSON format");
        console.log("  \u001B[32mindex.js --schema=template.json --of=SQL --f=result.json\u001B[0m   Generates test data from template.json and writes it to result.json in SQL format");
        console.log("  \u001B[32mindex.js --schema=template.json --db\u001B[0m                       Generates test data from template.json and writes it directly into the MongoDB");
        console.log("");
        var maxes = [
            Math.max.apply(Math, modelInput_1.argsHandler.map(function (singleArgsHandler) { return singleArgsHandler.aliases.join(", ").length; })),
            Math.max.apply(Math, modelInput_1.argsHandler.map(function (singleArgsHandler) { return singleArgsHandler.desc.length; }))
        ];
        console.log("[ \u001B[33mCommand Details\u001B[0m ]");
        //@ts-ignore
        var groupedHelp = Worker.groupArrayBy(modelInput_1.argsHandler, function (x) { return x.group; });
        groupedHelp.forEach(function (g) {
            console.log("[ \u001B[33m" + g[0].group + "\u001B[0m ]");
            g.forEach(function (argsHandle) {
                var aliase = argsHandle.aliases.join("\x1b[0m, \x1b[32m");
                var desc = argsHandle.desc;
                var spaces = " ".repeat(maxes[0] - argsHandle.aliases.join(', ').length);
                console.log("[ \u001B[32m" + aliase + "\u001B[0m ] " + spaces + "  " + desc);
            });
            console.log("");
        });
    };
    Worker.groupArrayBy = function (arr, grouper) {
        var map = new Map();
        arr.forEach(function (item) {
            var key = grouper(item);
            var collection = map.get(key);
            if (!collection) {
                map.set(key, [item]);
            }
            else {
                collection.push(item);
            }
        });
        return map;
    };
    Worker.printOutput = function (loglevel, text) {
        if (loglevel == "output")
            console.log("\u001B[0m[ \u001B[32mOutput\u001B[0m ]  " + text);
        if (loglevel == "info")
            console.log("\u001B[0m[ \u001B[34mOutput\u001B[0m ]  " + text);
        if (loglevel == "warn")
            console.log("\u001B[0m[ \u001B[33mOutput\u001B[0m ]  " + text);
        if (loglevel == "error")
            console.log("\u001B[0m[ \u001B[31mError\u001B[0m ]  " + text);
    };
    return Worker;
}());
exports.Worker = Worker;
