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
Object.defineProperty(exports, "__esModule", { value: true });
var Transformator = /** @class */ (function () {
    function Transformator() {
    }
    Transformator.transformTo = function (outputFormat, db) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = outputFormat;
                        switch (_a) {
                            case "json": return [3 /*break*/, 1];
                            case "sql": return [3 /*break*/, 2];
                            case "mongodb": return [3 /*break*/, 4];
                        }
                        return [3 /*break*/, 6];
                    case 1: 
                    //JSON.stringify(generatedCollections).split("\n");
                    return [3 /*break*/, 7];
                    case 2: return [4 /*yield*/, Transformator.transformToSQL(db)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 4: return [4 /*yield*/, Transformator.transformToMongo(db, 1)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 6: throw new Error("Output format '" + outputFormat + "' is not allowed. Check '--help' for help");
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    Transformator.transformToSQL = function (db) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.serialize(function () {
                            db.each("SELECT dbName, collectionName, value FROM temp_store", function (err, row) {
                                var tempColl = {
                                    dbName: row.dbName,
                                    collectionName: row.collectionName,
                                    documents: JSON.parse(row.value)
                                };
                                tempColl.documents.forEach(function (d) {
                                    var singleInsert = "INSERT INTO " + tempColl.dbName + "." + tempColl.collectionName + " (";
                                    var isFirst = true;
                                    d.documentFields.forEach(function (f) {
                                        if (isFirst)
                                            isFirst = false;
                                        else
                                            singleInsert += ", ";
                                        singleInsert += f.fieldName;
                                    });
                                    singleInsert += ") VALUES (";
                                    isFirst = true;
                                    d.documentFields.forEach(function (f) {
                                        if (isFirst)
                                            isFirst = false;
                                        else
                                            singleInsert += ", ";
                                        singleInsert += f.fieldNeedsQuotations ? "'" : "";
                                        singleInsert += f.fieldValue;
                                        singleInsert += f.fieldNeedsQuotations ? "'" : "";
                                    });
                                    singleInsert += ");";
                                    db.serialize(function () {
                                        var stmt = db.prepare("INSERT INTO temp_out (`value`) VALUES (?)");
                                        stmt.run(singleInsert);
                                        stmt.finalize();
                                    });
                                });
                            }, function () {
                                resolve();
                            });
                        });
                    })];
            });
        });
    };
    Transformator.transformToMongo = function (db, bulkinsertMax) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.serialize(function () {
                            db.each("SELECT dbName, collectionName, value FROM temp_store", function (err, row) {
                                var tempColl = {
                                    dbName: row.dbName,
                                    collectionName: row.collectionName,
                                    documents: JSON.parse(row.value)
                                };
                                var singleInsert = tempColl.dbName + "." + tempColl.collectionName + ".insert(";
                                var isFirstDoc = true;
                                tempColl.documents.forEach(function (document, index) {
                                    if (index % bulkinsertMax == 0 && index != 0 && index < tempColl.documents.length) {
                                        singleInsert += ");";
                                        Transformator.insertSingleInsert(db, singleInsert);
                                        singleInsert = tempColl.dbName + "." + tempColl.collectionName + ".insert(";
                                        isFirstDoc = true;
                                    }
                                    if (isFirstDoc)
                                        isFirstDoc = false;
                                    else
                                        singleInsert += ", ";
                                    singleInsert += "{";
                                    var isFirstField = true;
                                    document.documentFields.forEach(function (f) {
                                        var field = Transformator.transformSingleMongoField(f);
                                        if (field != null) {
                                            if (isFirstField)
                                                isFirstField = false;
                                            else
                                                singleInsert += ", ";
                                            singleInsert += Transformator.transformSingleMongoField(f);
                                        }
                                    });
                                    singleInsert += "}";
                                });
                                singleInsert += ");";
                                Transformator.insertSingleInsert(db, singleInsert);
                            }, function () {
                                resolve();
                            });
                        });
                    })];
            });
        });
    };
    Transformator.insertSingleInsert = function (db, singleInsert) {
        db.serialize(function () {
            var stmt = db.prepare("INSERT INTO temp_out (`value`) VALUES ($stuff)");
            stmt.run({ $stuff: singleInsert });
            stmt.finalize();
        });
    };
    Transformator.transformSingleMongoField = function (field) {
        if (field.fieldIsObject) {
            var isFirst_1 = true;
            var returnStr_1 = "\"" + field.fieldName + "\": {";
            field.fieldValue.forEach(function (f) {
                if (isFirst_1)
                    isFirst_1 = false;
                else
                    returnStr_1 += ", ";
                returnStr_1 += Transformator.transformSingleMongoField(f);
            });
            returnStr_1 += "}";
            return returnStr_1;
        }
        if (field.fieldIsArray) {
            if (field.fieldValue == 0)
                return null;
            var isFirst_2 = true;
            var returnStr_2 = "\"" + field.fieldName + "\": [";
            field.fieldValue.forEach(function (arrField) {
                if (isFirst_2)
                    isFirst_2 = false;
                else
                    returnStr_2 += ", ";
                var isFirstObj = true;
                returnStr_2 += "{";
                arrField.forEach(function (arrField) {
                    if (isFirstObj)
                        isFirstObj = false;
                    else
                        returnStr_2 += ", ";
                    returnStr_2 += Transformator.transformSingleMongoField(arrField);
                });
                returnStr_2 += "}";
            });
            returnStr_2 += "]";
            return returnStr_2;
        }
        if (field.fieldIsJsonObject) {
            var returnStr = "\"" + field.fieldName + "\": " + JSON.stringify(field.fieldValue);
            return returnStr;
        }
        if (field.fieldValue == null)
            return null;
        if (field.fieldNeedsQuotations)
            return "\"" + field.fieldName + "\": \"" + field.fieldValue + "\"";
        else
            return "\"" + field.fieldName + "\": " + field.fieldValue;
    };
    return Transformator;
}());
exports.Transformator = Transformator;
