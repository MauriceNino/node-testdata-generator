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
var generatorTypes_1 = require("../models/generatorTypes");
var ObjectID = require('bson').ObjectID;
/// <reference path="../../node_modules/@types/faker/index.d.ts"/>
var faker = require('faker');
var Generator = /** @class */ (function () {
    function Generator() {
    }
    ////////////////////////////////////////
    // Generate the keys of testdata
    ////////////////////////////////////////
    Generator.resolveCollectionKeys = function (db) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var possibleKeys = new Map();
                        db.serialize(function () {
                            db.each("SELECT dbName, collectionName, value FROM temp_store", function (err, row) {
                                var tempColl = {
                                    dbName: row.dbName,
                                    collectionName: row.collectionName,
                                    documents: JSON.parse(row.value)
                                };
                                tempColl.documents.forEach(function (d) {
                                    var tempKeys = Generator.findReferenceKeysInFields(d.documentFields);
                                    tempKeys.forEach(function (val, key) {
                                        // If return map has no key with that number, just append it
                                        if (!possibleKeys.has(key)) {
                                            possibleKeys.set(key, val);
                                        }
                                        else {
                                            possibleKeys.set(key, possibleKeys.get(key).concat(val));
                                        }
                                    });
                                });
                            });
                        });
                        db.serialize(function () {
                            db.each("SELECT rowid AS id, dbName, collectionName, value FROM temp_store", function (err, row) {
                                var tempColl = {
                                    dbName: row.dbName,
                                    collectionName: row.collectionName,
                                    documents: JSON.parse(row.value)
                                };
                                tempColl.documents.forEach(function (d) {
                                    d.documentFields = Generator.fillReferencesInFields(d.documentFields, possibleKeys);
                                });
                                var sql = "UPDATE temp_store SET value = '" + JSON.stringify(tempColl.documents) + "' WHERE rowid = " + row.id;
                                db.exec(sql, function (err) { });
                            }, function () {
                                resolve();
                            });
                        });
                    })];
            });
        });
    };
    Generator.fillReferencesInFields = function (fields, possibleKeys) {
        fields.forEach(function (f) {
            if (f.referenceTo != null) {
                var validKeys = possibleKeys.get(f.referenceTo);
                f.fieldValue = validKeys[Generator.nextRandomNumberBetween(0, validKeys.length - 1)];
            }
            if (f.fieldIsObject || f.fieldIsArray) {
                if (f.fieldIsObject) {
                    f.fieldValue = Generator.fillReferencesInFields(f.fieldValue, possibleKeys);
                }
                else if (f.fieldIsArray) {
                    f.fieldValue.forEach(function (subFields) {
                        subFields = Generator.fillReferencesInFields(subFields, possibleKeys);
                    });
                }
            }
        });
        return fields;
    };
    Generator.findReferenceKeysInFields = function (fields) {
        var returnMap = new Map();
        // Run through all  fields
        fields.forEach(function (f) {
            // Check if field has a referenceKey, if yes add it to returnMap
            if (f.referenceKey != null) {
                if (!returnMap.has(f.referenceKey)) {
                    returnMap.set(f.referenceKey, [f.fieldValue]);
                }
                else {
                    returnMap.get(f.referenceKey).push(f.fieldValue);
                }
            }
            // If field is array or object you need to run through all subFields and merge back the referenceKeys of subFields
            if (f.fieldIsObject || f.fieldIsArray) {
                var tempMap_1 = new Map();
                if (f.fieldIsObject) {
                    tempMap_1 = Generator.findReferenceKeysInFields(f.fieldValue);
                }
                else if (f.fieldIsArray) {
                    var subTempMap_1 = new Map();
                    f.fieldValue.forEach(function (subFields) {
                        subTempMap_1 = Generator.findReferenceKeysInFields(subFields);
                        // Merge found keys in subFields back to tempMap
                        subTempMap_1.forEach(function (val, key) {
                            // If return map has no key with that number, just append it
                            if (tempMap_1.get(key) == null) {
                                tempMap_1.set(key, val);
                            }
                            else {
                                tempMap_1.get(key).push(val);
                            }
                        });
                    });
                }
                // Merge found keys in subFields back to returnMap
                tempMap_1.forEach(function (val, key) {
                    // If return map has no key with that number, just append it
                    if (returnMap.get(key) == null) {
                        returnMap.set(key, val);
                    }
                    else {
                        returnMap.get(key).push(val);
                    }
                });
            }
        });
        return returnMap;
    };
    ////////////////////////////////////////
    // Generate the testdata
    ////////////////////////////////////////
    Generator.parseCollectionDescriptions = function (collectionDescriptions, maxKeepInRam, db) {
        return __awaiter(this, void 0, void 0, function () {
            var i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < collectionDescriptions.length)) return [3 /*break*/, 4];
                        return [4 /*yield*/, Generator.generateCollection(collectionDescriptions[i], maxKeepInRam, db)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Generator.generateCollection = function (collectionDescription, maxKeepInRam, db) {
        return __awaiter(this, void 0, void 0, function () {
            var tempResultCollection, generatedDocuments, documentsCount, i, tempResultDocument;
            return __generator(this, function (_a) {
                tempResultCollection = {
                    dbName: collectionDescription.databaseName,
                    collectionName: collectionDescription.collectionName,
                    documents: []
                };
                generatedDocuments = 0;
                documentsCount = collectionDescription.isDocumentStatic ? collectionDescription.staticDocuments.length : collectionDescription.documentsCount;
                for (i = 0; i < documentsCount; i++) {
                    tempResultDocument = {
                        documentFields: []
                    };
                    if (!collectionDescription.isDocumentStatic || (collectionDescription.isDocumentStatic && collectionDescription.injectIntoStatic)) {
                        tempResultDocument.documentFields = Generator.generateFields(collectionDescription.documentDescription);
                    }
                    if (collectionDescription.isDocumentStatic) {
                        tempResultDocument.documentFields = tempResultDocument.documentFields
                            .concat(Generator.generateFieldFromStatic(collectionDescription.staticDocuments[i]));
                    }
                    tempResultCollection.documents.push(tempResultDocument);
                    generatedDocuments++;
                    if (generatedDocuments % maxKeepInRam == 0 && generatedDocuments != 0) {
                        db.serialize(function () {
                            var stmt = db.prepare("INSERT INTO temp_store (`dbName`, `collectionName`, `value`) VALUES (?, ?, ?)");
                            stmt.run(tempResultCollection.dbName, tempResultCollection.collectionName, JSON.stringify(tempResultCollection.documents));
                            tempResultCollection.documents = [];
                            stmt.finalize();
                        });
                    }
                }
                db.serialize(function () {
                    var stmt = db.prepare("INSERT INTO temp_store (`dbName`, `collectionName`, `value`) VALUES (?, ?, ?)");
                    stmt.run(tempResultCollection.dbName, tempResultCollection.collectionName, JSON.stringify(tempResultCollection.documents));
                    tempResultCollection.documents = [];
                    stmt.finalize();
                });
                Generator.collectionGenerationFinished();
                return [2 /*return*/];
            });
        });
    };
    Generator.generateFieldFromStatic = function (staticDocument) {
        var tempFields = [];
        for (var property in staticDocument) {
            if (staticDocument.hasOwnProperty(property)) {
                var tempField = void 0;
                if (Array.isArray(staticDocument[property])) {
                    var arrContent = Generator.generateFieldFromStatic(staticDocument[property]);
                    arrContent = arrContent.map(function (c) { return c.fieldValue; });
                    tempField = {
                        fieldName: property,
                        fieldValue: arrContent,
                        fieldIsArray: true
                    };
                }
                else if (JSON.stringify(staticDocument[property]).charAt(0) == "{") {
                    tempField = {
                        fieldName: property,
                        fieldValue: Generator.generateFieldFromStatic(staticDocument[property]),
                        fieldIsObject: true
                    };
                }
                else {
                    tempField = {
                        fieldName: property,
                        fieldValue: staticDocument[property]
                    };
                }
                if (typeof tempField.fieldValue == "string" || tempField.fieldValue instanceof String) {
                    tempField.fieldNeedsQuotations = true;
                }
                tempFields.push(tempField);
            }
        }
        return tempFields;
    };
    Generator.generateFields = function (fieldDescriptions) {
        var tempResultFields = [];
        fieldDescriptions.forEach(function (desc) {
            tempResultFields.push(Generator.generateField(desc));
        });
        return tempResultFields;
    };
    Generator.generateField = function (fieldDescription) {
        var _a;
        var defaultFieldDescription = Generator.extractDefaultDescription(fieldDescription);
        var returnField = {
            fieldName: fieldDescription.fieldName,
            fieldValue: null
        };
        if (Generator.nextRandomNumber(100) < defaultFieldDescription.nullPercentage) {
            returnField.fieldValue = null;
            return returnField;
        }
        var skipQuotations = false;
        switch (fieldDescription.type) {
            case generatorTypes_1.GeneratorTypes.String:
                returnField.fieldValue = Generator.generateString(defaultFieldDescription, fieldDescription.unique, fieldDescription.lengthFrom, fieldDescription.lengthTo);
                break;
            case generatorTypes_1.GeneratorTypes.Number:
                returnField.fieldValue = Generator.generateNumber(defaultFieldDescription, fieldDescription.numberFrom, fieldDescription.numberTo);
                break;
            case generatorTypes_1.GeneratorTypes.Decimal:
                returnField.fieldValue = Generator.generateDecimal(defaultFieldDescription, fieldDescription.numberFrom, fieldDescription.numberTo, fieldDescription.maxDecimalPlaces);
                break;
            case generatorTypes_1.GeneratorTypes.AutoIncrement:
                returnField.fieldValue = Generator.generateAutoIncement(defaultFieldDescription, fieldDescription.autoIncrementStart, fieldDescription.autoIncrementSteps);
                break;
            case generatorTypes_1.GeneratorTypes.Boolean:
                returnField.fieldValue = Generator.generateBoolean(defaultFieldDescription, fieldDescription.percentTrue);
                break;
            case generatorTypes_1.GeneratorTypes.Object:
                returnField.fieldIsObject = true;
                returnField.fieldValue = Generator.generateFields(fieldDescription.subDocumentDescriptions);
                break;
            case generatorTypes_1.GeneratorTypes.Array:
                returnField.fieldIsArray = true;
                var sizeOfArr = fieldDescription.size != null ?
                    fieldDescription.size
                    : Generator.nextRandomNumberBetween(fieldDescription.sizeFrom, fieldDescription.sizeTo);
                returnField.fieldValue = Generator.repeat(Generator.generateFields, fieldDescription.subDocumentDescriptions, sizeOfArr);
                break;
            case generatorTypes_1.GeneratorTypes.Date:
                returnField.fieldValue = Generator.generateDate(defaultFieldDescription, fieldDescription.dateFrom, fieldDescription.dateTo);
                break;
            case generatorTypes_1.GeneratorTypes.Position:
                var randomPos = Generator.generatePosition(defaultFieldDescription, fieldDescription.positionCenterCoordinates, fieldDescription.positionRadius);
                var returnObj = [];
                returnObj.push({
                    fieldName: fieldDescription.positionNameX,
                    fieldValue: randomPos.lat
                });
                returnObj.push({
                    fieldName: fieldDescription.positionNameY,
                    fieldValue: randomPos.long
                });
                returnField.fieldValue = returnObj;
                returnField.fieldIsObject = true;
                break;
            case generatorTypes_1.GeneratorTypes.Constant:
                returnField.fieldValue = fieldDescription.constantValue;
                break;
            case generatorTypes_1.GeneratorTypes.ReferenceTo:
                returnField.referenceTo = fieldDescription.referenceTo;
                break;
            case generatorTypes_1.GeneratorTypes.Select:
                if (fieldDescription.fromArray[0] instanceof String) {
                    returnField.fieldNeedsQuotations = true;
                }
                returnField.fieldIsJsonObject = fieldDescription.selectFromObjects;
                returnField.fieldValue = Generator.generateSelect(defaultFieldDescription, fieldDescription.fromArray);
                break;
            case generatorTypes_1.GeneratorTypes.Faker:
                //@ts-ignore
                returnField.fieldValue = (_a = faker[fieldDescription.namespaceName])[fieldDescription.methodName].apply(_a, fieldDescription.methodParams);
                break;
            case generatorTypes_1.GeneratorTypes.ObjectId:
                var id = new ObjectID();
                returnField.fieldValue = "new ObjectId(\"" + id.toString() + "\")";
                skipQuotations = true;
                break;
        }
        if (fieldDescription.referenceKey != null) {
            returnField.referenceKey = fieldDescription.referenceKey;
        }
        if (!skipQuotations && (typeof returnField.fieldValue == "string" || returnField.fieldValue instanceof String)) {
            returnField.fieldNeedsQuotations = true;
        }
        return returnField;
    };
    ////////////////////////////////////////
    // Generate single datatype methods
    ////////////////////////////////////////
    Generator.generatePosition = function (defaultFieldDescription, positionCenterCoordinates, positionRadius) {
        var distanceFromCenter = Generator.nextRandomNumber(positionRadius);
        var distanceOffset = Generator.nextRandomNumber(360);
        return {
            long: Math.cos(distanceOffset * Math.PI / 180) * distanceFromCenter + positionCenterCoordinates.long,
            lat: Math.cos(distanceOffset * Math.PI / 180) * distanceFromCenter + positionCenterCoordinates.lat
        };
    };
    Generator.generateSelect = function (defaultFieldDescription, fromArray) {
        return fromArray[Generator.nextRandomNumber(fromArray.length)];
    };
    Generator.generateDate = function (defaultFieldDescription, dateFrom, dateTo) {
        var start = new Date(dateFrom);
        var end = new Date(dateTo);
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
    };
    Generator.generateBoolean = function (defaultFieldDescription, percentTrue) {
        if (Generator.nextRandomNumber(100) < percentTrue)
            return true;
        else
            return false;
    };
    Generator.generateAutoIncement = function (defaultDesc, autoIncrementStart, autoIncrementSteps) {
        if (Generator.lastAutoIncrement == null) {
            Generator.lastAutoIncrement = autoIncrementStart;
        }
        else {
            Generator.lastAutoIncrement = Generator.lastAutoIncrement + autoIncrementSteps;
        }
        return Generator.lastAutoIncrement;
    };
    Generator.generateDecimal = function (defaultDesc, numberFrom, numberTo, maxDecimalPlaces) {
        return Math.round(Generator.nextRandomDecimalBetween(numberFrom, numberTo) * Math.pow(10, maxDecimalPlaces)) / Math.pow(10, maxDecimalPlaces);
    };
    Generator.generateNumber = function (defaultDesc, numberFrom, numberTo) {
        return Generator.nextRandomNumberBetween(numberFrom, numberTo);
    };
    Generator.generateString = function (defaultDesc, unique, lengthFrom, lengthTo) {
        var generatedString = "";
        var randomLength = Generator.nextRandomNumberBetween(lengthFrom, lengthTo);
        for (var i = 0; i < randomLength; i++)
            generatedString += Generator.availableCharacters.charAt(Generator.nextRandomNumber(Generator.availableCharacters.length));
        return generatedString;
    };
    Generator.collectionGenerationFinished = function () {
        Generator.lastAutoIncrement = null;
        Generator.lastGeneratedString = null;
    };
    ////////////////////////////////////////
    // HELPERS
    ////////////////////////////////////////
    Generator.repeat = function (generateFunc, fieldDescription, size) {
        var returnArr = [];
        for (var i = 0; i < size; i++) {
            returnArr.push(generateFunc(fieldDescription));
        }
        return returnArr;
    };
    Generator.extractDefaultDescription = function (fieldDescription) {
        return {
            fieldName: fieldDescription.fieldName,
            type: fieldDescription.type,
            nullPercentage: fieldDescription.nullPercentage,
        };
    };
    Generator.nextRandomDecimal = function (max) {
        return Math.random() * Math.floor(max);
    };
    Generator.nextRandomDecimalBetween = function (min, max) {
        return Math.random() * Math.floor(max);
    };
    Generator.nextRandomNumber = function (max) {
        return Math.floor(Math.random() * Math.floor(max));
    };
    Generator.nextRandomNumberBetween = function (min, max) {
        return Generator.nextRandomNumber(max - min + 1) + min;
    };
    Generator.availableCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Generator;
}());
exports.Generator = Generator;
