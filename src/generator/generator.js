"use strict";
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
    Generator.resolveCollectionKeys = function (generatedCollections) {
        var possibleKeys = new Map();
        generatedCollections.forEach(function (c) {
            c.documents.forEach(function (d) {
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
        generatedCollections.forEach(function (c) {
            c.documents.forEach(function (d) {
                d.documentFields = Generator.fillReferencesInFields(d.documentFields, possibleKeys);
            });
        });
        return generatedCollections;
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
    Generator.parseCollectionDescriptions = function (collectionDescriptions) {
        var resultCollections = [];
        collectionDescriptions.forEach(function (collectionDescription) {
            resultCollections.push(Generator.generateCollection(collectionDescription));
        });
        return resultCollections;
    };
    Generator.generateCollection = function (collectionDescription) {
        var tempResultCollection = {
            dbName: collectionDescription.databaseName,
            collectionName: collectionDescription.collectionName,
            documents: []
        };
        var documentsCount = collectionDescription.isDocumentStatic ? collectionDescription.staticDocuments.length : collectionDescription.documentsCount;
        for (var i = 0; i < documentsCount; i++) {
            var tempResultDocument = {
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
        }
        Generator.collectionGenerationFinished();
        return tempResultCollection;
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
