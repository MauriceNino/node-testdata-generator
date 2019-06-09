"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Transformator = /** @class */ (function () {
    function Transformator() {
    }
    Transformator.transformToSQL = function (collections) {
        var resultArr = [];
        return resultArr;
    };
    Transformator.transformToMongo = function (collections, bulkinsertMax) {
        var resultArr = [];
        collections.forEach(function (collection) {
            var singleInsert = collection.dbName + "." + collection.collectionName + ".insertMany([";
            var isFirstDoc = true;
            collection.documents.forEach(function (document, index) {
                if (index % bulkinsertMax == 0 && index != 0 && index < collection.documents.length) {
                    singleInsert += "])";
                    resultArr.push(singleInsert);
                    singleInsert = collection.dbName + "." + collection.collectionName + ".insertMany([";
                    isFirstDoc = true;
                }
                if (isFirstDoc)
                    isFirstDoc = false;
                else
                    singleInsert += ", ";
                singleInsert += "{";
                var isFirstField = true;
                document.documentFields.forEach(function (f) {
                    if (isFirstField)
                        isFirstField = false;
                    else
                        singleInsert += ", ";
                    singleInsert += Transformator.transforSingleMongoField(f);
                });
                singleInsert += "}";
            });
            singleInsert += "])";
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
            var isFirst_2 = true;
            var returnStr_2 = "[";
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
        if (field.fieldNeedsQuotations)
            return "\"" + field.fieldName + "\": \"" + field.fieldValue + "\"";
        else
            return "\"" + field.fieldName + "\": " + field.fieldValue;
    };
    return Transformator;
}());
exports.Transformator = Transformator;
