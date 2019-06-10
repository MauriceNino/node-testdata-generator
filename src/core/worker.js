"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var sqlite3_1 = __importDefault(require("sqlite3"));
var db = new sqlite3_1.default.Database(':memory:');
var NodeTestdataGenerator = /** @class */ (function () {
    function NodeTestdataGenerator() {
    }
    NodeTestdataGenerator.doWork = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var collectionDescriptions, dbConnection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!opts.createTemplate) return [3 /*break*/, 1];
                        NodeTestdataGenerator.writeTemplateToFile(opts.outputFilename);
                        return [3 /*break*/, 6];
                    case 1:
                        collectionDescriptions = JSON.parse(NodeTestdataGenerator.readData(opts.schemaFile));
                        if (collectionDescriptions.length == 0)
                            NodeTestdataGenerator.printOutput("warn", "Input file is empty!");
                        return [4 /*yield*/, NodeTestdataGenerator.initializeInMemoryDatabase()];
                    case 2:
                        dbConnection = _a.sent();
                        return [4 /*yield*/, generator_1.Generator.parseCollectionDescriptions(collectionDescriptions, 50, dbConnection)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, generator_1.Generator.resolveCollectionKeys(dbConnection)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, transformator_1.Transformator.transformTo(opts.outputFormat, dbConnection)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    NodeTestdataGenerator.cmdDoWork = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var collectionDescriptions, dbConnection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!opts.printHelp) return [3 /*break*/, 1];
                        NodeTestdataGenerator.printHelp();
                        return [3 /*break*/, 8];
                    case 1:
                        if (!opts.createTemplate) return [3 /*break*/, 2];
                        NodeTestdataGenerator.writeTemplateToFile(opts.outputFilename);
                        return [3 /*break*/, 8];
                    case 2:
                        collectionDescriptions = JSON.parse(NodeTestdataGenerator.readData(opts.schemaFile));
                        if (collectionDescriptions.length == 0)
                            NodeTestdataGenerator.printOutput("warn", "Input file is empty!");
                        return [4 /*yield*/, NodeTestdataGenerator.initializeInMemoryDatabase()];
                    case 3:
                        dbConnection = _a.sent();
                        return [4 /*yield*/, generator_1.Generator.parseCollectionDescriptions(collectionDescriptions, 50, dbConnection)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, generator_1.Generator.resolveCollectionKeys(dbConnection)];
                    case 5:
                        _a.sent();
                        if (!(opts.outputType == "cmd" && opts.outputFormat == "json")) return [3 /*break*/, 6];
                        db.serialize(function () {
                            db.each("SELECT dbName, collectionName, value FROM temp_store", function (err, row) {
                                var tempColl = {
                                    dbName: row.dbName,
                                    collectionName: row.collectionName,
                                    documents: JSON.parse(row.value)
                                };
                                console.log(util_1.default.inspect(tempColl, false, null, true));
                            });
                        });
                        return [3 /*break*/, 8];
                    case 6: return [4 /*yield*/, transformator_1.Transformator.transformTo(opts.outputFormat, dbConnection)];
                    case 7:
                        _a.sent();
                        switch (opts.outputType) {
                            case "cmd":
                                db.serialize(function () {
                                    db.each("SELECT value FROM temp_out", function (err, row) {
                                        console.log(row.value);
                                    });
                                });
                                break;
                            case "file":
                                db.serialize(function () {
                                    db.each("SELECT value FROM temp_out", function (err, row) {
                                        NodeTestdataGenerator.appendToFile(opts.outputFilename, row.value);
                                    });
                                });
                                break;
                            default:
                                throw new Error("Output Type '" + opts.outputType + "' is not allowed. Check '--help' for help");
                        }
                        _a.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    NodeTestdataGenerator.initializeInMemoryDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.serialize(function () {
                            db.run("CREATE TABLE temp_store (dbName TEXT, collectionName TEXT, value JSON)", function () {
                                db.run("CREATE TABLE temp_out (value TEXT)", function () {
                                    resolve(db);
                                });
                            });
                        });
                    })];
            });
        });
    };
    NodeTestdataGenerator.destroyInMemoryDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.close(function () {
                            resolve();
                        });
                    })];
            });
        });
    };
    NodeTestdataGenerator.writeTemplateToFile = function (fileName) {
        var template = "[\n    {\n        \"databaseName\": \"db\",\n        \"collectionName\": \"test\",\n        \"size\": 100,\n        \"documentDescription\": {\n            \"testDocField\": {\n                \"type\": \"string\",\n                \"nullPercentage\": 0,\n                \"id\": 0,\n                \"lengthFrom\": 0,\n                \"lengthTo\": 10\n            }\n        }\n    }\n]";
        fs_1.default.writeFileSync(fileName, template);
        NodeTestdataGenerator.printOutput("output", "Template written to file");
    };
    NodeTestdataGenerator.writeToFile = function (fileName, content) {
        fs_1.default.writeFileSync(fileName, content);
        NodeTestdataGenerator.printOutput("output", "Content written to file");
    };
    NodeTestdataGenerator.appendToFile = function (fileName, content) {
        fs_1.default.appendFileSync(fileName, content);
    };
    NodeTestdataGenerator.createFile = function (fileName) {
        return fs_1.default.openSync(fileName, 'w');
    };
    NodeTestdataGenerator.readData = function (fileName) {
        var buffer = fs_1.default.readFileSync(path_1.default.join(process.cwd(), fileName));
        return buffer.toString();
    };
    NodeTestdataGenerator.printHelp = function () {
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
        var groupedHelp = NodeTestdataGenerator.groupArrayBy(modelInput_1.argsHandler, function (x) { return x.group; });
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
    NodeTestdataGenerator.groupArrayBy = function (arr, grouper) {
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
    NodeTestdataGenerator.printOutput = function (loglevel, text) {
        if (loglevel == "output")
            console.log("\u001B[0m[ \u001B[32mOutput\u001B[0m ]  " + text);
        if (loglevel == "info")
            console.log("\u001B[0m[ \u001B[34mOutput\u001B[0m ]  " + text);
        if (loglevel == "warn")
            console.log("\u001B[0m[ \u001B[33mOutput\u001B[0m ]  " + text);
        if (loglevel == "error")
            console.log("\u001B[0m[ \u001B[31mError\u001B[0m ]  " + text);
    };
    return NodeTestdataGenerator;
}());
exports.NodeTestdataGenerator = NodeTestdataGenerator;
