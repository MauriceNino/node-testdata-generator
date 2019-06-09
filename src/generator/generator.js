"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var generatorTypes_1 = require("../models/generatorTypes");
/// <reference path="../../node_modules/@types/faker/index.d.ts"/>
var faker = require('faker');
var Generator = /** @class */ (function () {
    function Generator() {
    }
    Generator.generateCollection = function (collectionDescription) {
        var tempResultCollection = {
            dbName: collectionDescription.databaseName,
            collectionName: collectionDescription.collectionName,
            documents: []
        };
        for (var i = 0; i < collectionDescription.documentsCount; i++) {
            var tempResultDocument = {
                documentFields: []
            };
            tempResultDocument.documentFields = Generator.generateFields(collectionDescription.documentDescription);
            tempResultCollection.documents.push(tempResultDocument);
        }
        Generator.collectionGenerationFinished();
        return tempResultCollection;
    };
    Generator.generateFields = function (fieldDescriptions) {
        var tempResultFields = [];
        fieldDescriptions.forEach(function (desc) {
            tempResultFields.push(Generator.generateField(desc));
        });
        return tempResultFields;
    };
    Generator.generateField = function (fieldDescription) {
        var defaultFieldDescription = Generator.extractDefaultDescription(fieldDescription);
        var returnField = {
            fieldName: fieldDescription.fieldName,
            fieldValue: null
        };
        if (Generator.nextRandomNumber(100) < defaultFieldDescription.nullPercentage) {
            returnField.fieldValue = null;
            return returnField;
        }
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
                var returnObj = {};
                //@ts-ignore
                returnObj[fieldDescription.positionNameX] = randomPos.long;
                //@ts-ignore
                returnObj[fieldDescription.positionNameY] = randomPos.lat;
                returnField.fieldValue = returnObj;
                returnField.fieldIsObject = true;
                break;
            case generatorTypes_1.GeneratorTypes.Constant:
                returnField.fieldValue = fieldDescription.constantValue;
                break;
            case generatorTypes_1.GeneratorTypes.Reference:
                throw new Error("Not implemented");
                break;
            case generatorTypes_1.GeneratorTypes.Select:
                if (fieldDescription.fromArray[0] instanceof String) {
                    returnField.fieldNeedsQuotations = true;
                }
                returnField.fieldValue = Generator.generateSelect(defaultFieldDescription, fieldDescription.fromArray);
                break;
            case generatorTypes_1.GeneratorTypes.Faker:
                //@ts-ignore
                returnField.fieldValue = faker[fieldDescription.namespaceName][fieldDescription.methodName]();
                break;
        }
        if (typeof returnField.fieldValue == "string" || returnField.fieldValue instanceof String) {
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
