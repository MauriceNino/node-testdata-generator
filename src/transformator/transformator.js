"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Transformator = /** @class */ (function () {
    function Transformator() {
    }
    Transformator.transformTo = function (outputFormat, generatedCollections, keepJson) {
        if (keepJson === void 0) { keepJson = false; }
        var outputArr;
        switch (outputFormat) {
            case "json":
                if (keepJson)
                    return generatedCollections;
                else
                    outputArr = JSON.stringify(generatedCollections).split("\n");
                break;
            case "sql":
                outputArr = Transformator.transformToSQL(generatedCollections);
                break;
            case "mongodb":
                outputArr = Transformator.transformToMongo(generatedCollections, 1);
                break;
            default:
                throw new Error("Output format '" + outputFormat + "' is not allowed. Check '--help' for help");
        }
        return outputArr;
    };
    Transformator.transformToSQL = function (collections) {
        var resultArr = [];
        collections.forEach(function (collection) {
            collection.documents.forEach(function (document) {
                var singleInsert = "INSERT INTO " + collection.dbName + "." + collection.collectionName + " (";
                var isFirst = true;
                document.documentFields.forEach(function (f) {
                    if (isFirst)
                        isFirst = false;
                    else
                        singleInsert += ", ";
                    singleInsert += f.fieldName;
                });
                singleInsert += ") VALUES (";
                isFirst = true;
                document.documentFields.forEach(function (f) {
                    if (isFirst)
                        isFirst = false;
                    else
                        singleInsert += ", ";
                    singleInsert += f.fieldNeedsQuotations ? "'" : "";
                    singleInsert += f.fieldValue;
                    singleInsert += f.fieldNeedsQuotations ? "'" : "";
                });
                singleInsert += ");";
                resultArr.push(singleInsert);
            });
        });
        return resultArr;
    };
    Transformator.transformToMongo = function (collections, bulkinsertMax) {
        var resultArr = [];
        collections.forEach(function (collection) {
            var singleInsert = collection.dbName + "." + collection.collectionName + ".insert(";
            var isFirstDoc = true;
            collection.documents.forEach(function (document, index) {
                if (index % bulkinsertMax == 0 && index != 0 && index < collection.documents.length) {
                    singleInsert += ");";
                    resultArr.push(singleInsert);
                    singleInsert = collection.dbName + "." + collection.collectionName + ".insert(";
                    isFirstDoc = true;
                }
                if (isFirstDoc)
                    isFirstDoc = false;
                else
                    singleInsert += ", ";
                singleInsert += "{";
                var isFirstField = true;
                document.documentFields.forEach(function (f) {
                    var field = Transformator.transforSingleMongoField(f);
                    if (field != null) {
                        if (isFirstField)
                            isFirstField = false;
                        else
                            singleInsert += ", ";
                        singleInsert += Transformator.transforSingleMongoField(f);
                    }
                });
                singleInsert += "}";
            });
            singleInsert += ");";
            resultArr.push(singleInsert);
        });
        return resultArr;
    };
    Transformator.transforSingleMongoField = function (field) {
        if (field.fieldIsObject) {
            var isFirst_1 = true;
            var returnStr_1 = "\"" + field.fieldName + "\": {";
            field.fieldValue.forEach(function (f) {
                if (isFirst_1)
                    isFirst_1 = false;
                else
                    returnStr_1 += ", ";
                returnStr_1 += Transformator.transforSingleMongoField(f);
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
                    returnStr_2 += Transformator.transforSingleMongoField(arrField);
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
