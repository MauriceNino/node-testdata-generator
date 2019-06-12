import { IDefaultDocumentFieldDescription, IDocumentFieldDescription, ICollectionDescription } from "../models/modelInput";
import { IGeneratedField, IGeneratedCollection, IGeneratedDocument } from "../models/modelGenerated";
import { GeneratorTypes } from "../models/generatorTypes";
var ObjectID = require('bson').ObjectID;

/// <reference path="../../node_modules/@types/faker/index.d.ts"/>
var faker: Faker.FakerStatic = require('faker');

import sqlite3 from "sqlite3";
import util from 'util';
import { NodeTestdataGenerator } from "../core/worker";

export class Generator {
    ////////////////////////////////////////
    // Generate the keys of testdata
    ////////////////////////////////////////

    private static totalDocumentsResolved = 0;
    public static async resolveCollectionKeys(db: sqlite3.Database, total: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let possibleKeys: Map<number, any[]> = new Map();

            db.serialize(() => {
                db.each("SELECT dbName, collectionName, value FROM temp_store", function(err, row) {
                    let tempColl: IGeneratedCollection = {
                        dbName: row.dbName,
                        collectionName: row.collectionName,
                        documents: JSON.parse(row.value)
                    }

                    tempColl.documents.forEach(d => {
                
                        let tempKeys: Map<number, any[]> = Generator.findReferenceKeysInFields(d.documentFields);
                        tempKeys.forEach((val: any[], key: number) => {
                            // If return map has no key with that number, just append it
                            if(!possibleKeys.has(key)) {
                                possibleKeys.set(key, val);
                            } else {
                                possibleKeys.set(key, possibleKeys.get(key).concat(val));
                            }
                        });

                        Generator.totalDocumentsResolved++;
                        NodeTestdataGenerator.updateProgressbar(Generator.totalDocumentsResolved);
                    });
                }, () => {
                    Generator.totalDocumentsResolved = 0;
                    NodeTestdataGenerator.stopProgressbar();
                    NodeTestdataGenerator.startProgressBar("Applying Keys     ", total);
        
                    db.serialize(() => {
                        db.each("SELECT rowid AS id, dbName, collectionName, value FROM temp_store", (err, row) => {
                            let tempColl: IGeneratedCollection = {
                                dbName: row.dbName,
                                collectionName: row.collectionName,
                                documents: JSON.parse(row.value)
                            }
                            
                            tempColl.documents.forEach(d => {
                                d.documentFields = Generator.fillReferencesInFields(d.documentFields, possibleKeys);
        
                                Generator.totalDocumentsResolved++;
                                NodeTestdataGenerator.updateProgressbar(Generator.totalDocumentsResolved);
                            });
        
                            let sql = `UPDATE temp_store SET value = '${JSON.stringify(tempColl.documents)}' WHERE rowid = ${row.id}`;
                            
                            db.exec(sql, (err) => {});
                        }, () => {
                            resolve();
                        });
                    });
                });
            });
        });
    }

    private static fillReferencesInFields(fields: IGeneratedField[], possibleKeys: Map<number, any[]>): IGeneratedField[] {
        fields.forEach(f => {
            if(f.referenceTo != null) {
                let validKeys = possibleKeys.get(f.referenceTo);
                f.fieldValue = validKeys[Generator.nextRandomNumberBetween(0, validKeys.length-1)];
            }

            if(f.fieldIsObject || f.fieldIsArray) {
                if(f.fieldIsObject) {
                    f.fieldValue = Generator.fillReferencesInFields(f.fieldValue, possibleKeys);
                } else if(f.fieldIsArray) {
                    f.fieldValue.forEach((subFields: IGeneratedField[]) => {
                        subFields = Generator.fillReferencesInFields(subFields, possibleKeys);
                    });
                }
            }
        })

        return fields;
    }

    private static findReferenceKeysInFields(fields: IGeneratedField[]): Map<number, any[]> {
        let returnMap: Map<number, any[]> = new Map();
        
        // Run through all  fields
        fields.forEach(f => {
            // Check if field has a referenceKey, if yes add it to returnMap
            if(f.referenceKey != null) {
                if(!returnMap.has(f.referenceKey)) {
                    returnMap.set(f.referenceKey, [ f.fieldValue ]);
                } else {
                    returnMap.get(f.referenceKey).push(f.fieldValue);
                }
            }
            
            // If field is array or object you need to run through all subFields and merge back the referenceKeys of subFields
            if(f.fieldIsObject || f.fieldIsArray) {
                let tempMap: Map<number, any[]> = new Map();
                if(f.fieldIsObject) {
                    tempMap = Generator.findReferenceKeysInFields(f.fieldValue);
                } else if(f.fieldIsArray) {
                    let subTempMap: Map<number, any[]> = new Map();
                    f.fieldValue.forEach((subFields: IGeneratedField[]) => {
                        subTempMap = Generator.findReferenceKeysInFields(subFields);

                        // Merge found keys in subFields back to tempMap
                        subTempMap.forEach((val: any[], key: number) => {
                            // If return map has no key with that number, just append it
                            if(tempMap.get(key) == null) {
                                tempMap.set(key, val);
                            } else {
                                tempMap.get(key).push(val);
                            }
                        });
                    });
                }

                // Merge found keys in subFields back to returnMap
                tempMap.forEach((val: any[], key: number) => {
                    // If return map has no key with that number, just append it
                    if(returnMap.get(key) == null) {
                        returnMap.set(key, val);
                    } else {
                        returnMap.get(key).push(val);
                    }
                });
            }
        });
        return returnMap;
    }




    ////////////////////////////////////////
    // Generate the testdata
    ////////////////////////////////////////

    private static totalDocumentsCreated = 0;
    public static async parseCollectionDescriptions(collectionDescriptions: ICollectionDescription[], maxKeepInRam: number, db: sqlite3.Database): Promise<void> {
        for(let i=0; i<collectionDescriptions.length; i++) {
            await Generator.generateCollection(collectionDescriptions[i], maxKeepInRam, db);
        }
    }
    
    public static async generateCollection(collectionDescription: ICollectionDescription, maxKeepInRam: number, db: sqlite3.Database): Promise<void> {
        let tempResultCollection: IGeneratedCollection = {
            dbName: collectionDescription.databaseName,
            collectionName: collectionDescription.collectionName,
            documents: []
        }
        let generatedDocuments: number = 0;
        let documentsCount: number = collectionDescription.isDocumentStatic?collectionDescription.staticDocuments.length:collectionDescription.documentsCount;
        for(let i=0; i<documentsCount; i++) {
            let tempResultDocument: IGeneratedDocument = {
                documentFields: []
            }

            if(!collectionDescription.isDocumentStatic || (collectionDescription.isDocumentStatic && collectionDescription.injectIntoStatic)) {
                tempResultDocument.documentFields = Generator.generateFields(collectionDescription.documentDescription);
            }

            if(collectionDescription.isDocumentStatic) {
                tempResultDocument.documentFields = tempResultDocument.documentFields
                    .concat(Generator.generateFieldFromStatic(collectionDescription.staticDocuments[i]));
            }

            tempResultCollection.documents.push(tempResultDocument);
            generatedDocuments++;

            Generator.totalDocumentsCreated++;
            NodeTestdataGenerator.updateProgressbar(Generator.totalDocumentsCreated);

            if(generatedDocuments % maxKeepInRam == 0 && generatedDocuments != 0){
                db.serialize(() => {
                    var stmt = db.prepare("INSERT INTO temp_store (`dbName`, `collectionName`, `value`) VALUES (?, ?, ?)");
                    stmt.run(tempResultCollection.dbName, tempResultCollection.collectionName, JSON.stringify(tempResultCollection.documents));
                    tempResultCollection.documents = []
                    stmt.finalize();
                });
            }
        }

        db.serialize(() => {
            var stmt = db.prepare("INSERT INTO temp_store (`dbName`, `collectionName`, `value`) VALUES (?, ?, ?)");
            stmt.run(tempResultCollection.dbName, tempResultCollection.collectionName, JSON.stringify(tempResultCollection.documents));
            tempResultCollection.documents = []
            stmt.finalize();
        });

        Generator.collectionGenerationFinished();
    }

    public static generateFieldFromStatic(staticDocument: any): IGeneratedField[] {
        let tempFields: IGeneratedField[] = [];

        for (let property in staticDocument) {
            if (staticDocument.hasOwnProperty(property)) {
                let tempField: IGeneratedField;
                if(Array.isArray(staticDocument[property])) {
                    let arrContent = Generator.generateFieldFromStatic(staticDocument[property]);
                    arrContent = arrContent.map(c => c.fieldValue);

                    tempField = {
                        fieldName: property,
                        fieldValue: arrContent,
                        fieldIsArray: true
                    };
                } else if(JSON.stringify(staticDocument[property]).charAt(0)=="{") {
                    tempField = {
                        fieldName: property,
                        fieldValue: Generator.generateFieldFromStatic(staticDocument[property]),
                        fieldIsObject: true
                    };
                } else {
                    tempField = {
                        fieldName: property,
                        fieldValue: staticDocument[property]
                    };
                }
        
                if(typeof tempField.fieldValue == "string" || tempField.fieldValue instanceof String) {
                    tempField.fieldNeedsQuotations = true;
                }
                
                tempFields.push(tempField);
            }
        }

        return tempFields;
    }

    public static generateFields(fieldDescriptions: IDocumentFieldDescription []): IGeneratedField [] {
        let tempResultFields: IGeneratedField [] = [];
        
        fieldDescriptions.forEach((desc: IDocumentFieldDescription) => {
            tempResultFields.push(Generator.generateField(desc))
        })

        return tempResultFields;
    }

    public static generateField(fieldDescription: IDocumentFieldDescription): IGeneratedField {
        let defaultFieldDescription: IDefaultDocumentFieldDescription = Generator.extractDefaultDescription(fieldDescription);

        let returnField: IGeneratedField = {
            fieldName: fieldDescription.fieldName,
            fieldValue: null
        }

        if(Generator.nextRandomNumber(100) < defaultFieldDescription.nullPercentage) {
            returnField.fieldValue = null;
            return returnField
        }
        
        let skipQuotations: boolean = false;
        switch(fieldDescription.type) {
            case GeneratorTypes.String:
                returnField.fieldValue = Generator.generateString(defaultFieldDescription, fieldDescription.unique, fieldDescription.lengthFrom, fieldDescription.lengthTo);
                break;
            case GeneratorTypes.Number:
                returnField.fieldValue = Generator.generateNumber(defaultFieldDescription, fieldDescription.numberFrom, fieldDescription.numberTo);
                break;
            case GeneratorTypes.Decimal:
                returnField.fieldValue = Generator.generateDecimal(defaultFieldDescription, fieldDescription.numberFrom, fieldDescription.numberTo, fieldDescription.maxDecimalPlaces);
                break;
            case GeneratorTypes.AutoIncrement:
                returnField.fieldValue = Generator.generateAutoIncement(defaultFieldDescription, fieldDescription.autoIncrementStart, fieldDescription.autoIncrementSteps);
                break;
            case GeneratorTypes.Boolean:
                returnField.fieldValue = Generator.generateBoolean(defaultFieldDescription, fieldDescription.percentTrue);
                break;
            case GeneratorTypes.Object:
                returnField.fieldIsObject = true;
                returnField.fieldValue = Generator.generateFields(fieldDescription.subDocumentDescriptions);
                break;
            case GeneratorTypes.Array:
                returnField.fieldIsArray = true;
                
                if(fieldDescription.unboxElements)
                    returnField.unboxElements = true;

                const sizeOfArr: number = fieldDescription.size != null? 
                    fieldDescription.size
                    : Generator.nextRandomNumberBetween(fieldDescription.sizeFrom, fieldDescription.sizeTo);

                returnField.fieldValue = Generator.repeat(
                    Generator.generateFields,
                    fieldDescription.subDocumentDescriptions,
                    sizeOfArr
                );
                break;
            case GeneratorTypes.Date:
                returnField.fieldValue = Generator.generateDate(defaultFieldDescription, fieldDescription.dateFrom, fieldDescription.dateTo);
                break;
            case GeneratorTypes.Position:
                const randomPos = Generator.generatePosition(defaultFieldDescription, fieldDescription.positionCenterCoordinates, fieldDescription.positionRadius);
                let returnObj: IGeneratedField[] = []

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
            case GeneratorTypes.Constant:
                returnField.fieldValue = fieldDescription.constantValue;
                break;
            case GeneratorTypes.ReferenceTo:
                returnField.referenceTo = fieldDescription.referenceTo;
                break;
            case GeneratorTypes.Select:
                if(fieldDescription.fromArray[0] instanceof String) {
                    returnField.fieldNeedsQuotations = true;
                }
                returnField.fieldIsJsonObject = fieldDescription.selectFromObjects;
                returnField.fieldValue = Generator.generateSelect(defaultFieldDescription, fieldDescription.fromArray);
                break;
            case GeneratorTypes.Faker:
                //@ts-ignore
                returnField.fieldValue = faker[fieldDescription.namespaceName][fieldDescription.methodName](...fieldDescription.methodParams);
                break;
            case GeneratorTypes.ObjectId:
                const id  = new ObjectID();
                returnField.fieldValue = `new ObjectId("${id.toString()}")`;
                skipQuotations = true;
                break;
        }

        if(fieldDescription.referenceKey != null) {
            returnField.referenceKey = fieldDescription.referenceKey;
        }
        
        if(!skipQuotations && (typeof returnField.fieldValue == "string" || returnField.fieldValue instanceof String)) {
            returnField.fieldNeedsQuotations = true;
        }

        return returnField;
    }




    ////////////////////////////////////////
    // Generate single datatype methods
    ////////////////////////////////////////

    static generatePosition(defaultFieldDescription: IDefaultDocumentFieldDescription, positionCenterCoordinates: { long: number; lat: number; }, positionRadius: number): any {
        let distanceFromCenter: number = Generator.nextRandomNumber(positionRadius);
        let distanceOffset: number = Generator.nextRandomNumber(360);

        return {
            long: Math.cos(distanceOffset*Math.PI/180) * distanceFromCenter + positionCenterCoordinates.long,
            lat: Math.cos(distanceOffset*Math.PI/180) * distanceFromCenter + positionCenterCoordinates.lat
        }
    }

    public static generateSelect(defaultFieldDescription: IDefaultDocumentFieldDescription, fromArray: any[]): any {
        return fromArray[Generator.nextRandomNumber(fromArray.length)];
    }

    public static generateDate(defaultFieldDescription: IDefaultDocumentFieldDescription, dateFrom: string, dateTo: string): string {
        const start: Date = new Date(dateFrom);
        const end: Date = new Date(dateTo);
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
    }

    public static generateBoolean(defaultFieldDescription: IDefaultDocumentFieldDescription, percentTrue: number): boolean {
        if(Generator.nextRandomNumber(100) < percentTrue) return true;
        else return false;
    }

    private static lastAutoIncrement: number
    public static generateAutoIncement(defaultDesc: IDefaultDocumentFieldDescription, autoIncrementStart: number, autoIncrementSteps: number): number {
        if(Generator.lastAutoIncrement == null) {
            Generator.lastAutoIncrement = autoIncrementStart;
        } else {
            Generator.lastAutoIncrement = Generator.lastAutoIncrement + autoIncrementSteps;
        }

        return Generator.lastAutoIncrement;
    }
    
    public static generateDecimal(defaultDesc: IDefaultDocumentFieldDescription, numberFrom: number, numberTo: number, maxDecimalPlaces: number): number {
        return Math.round(Generator.nextRandomDecimalBetween(numberFrom, numberTo) * Math.pow(10, maxDecimalPlaces)) / Math.pow(10, maxDecimalPlaces);
    }

    public static generateNumber(defaultDesc: IDefaultDocumentFieldDescription, numberFrom: number, numberTo: number): number {
        return Generator.nextRandomNumberBetween(numberFrom, numberTo);
    }

    private static lastGeneratedString: string;
    private static availableCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    public static generateString(defaultDesc: IDefaultDocumentFieldDescription, unique: boolean, lengthFrom: number, lengthTo: number): string {
        let generatedString = "";
        const randomLength: number = Generator.nextRandomNumberBetween(lengthFrom, lengthTo);
        for(let i=0; i<randomLength; i++)
            generatedString += Generator.availableCharacters.charAt(Generator.nextRandomNumber(Generator.availableCharacters.length));

        return generatedString;
    }

    public static collectionGenerationFinished(): void {
        Generator.lastAutoIncrement = null;
        Generator.lastGeneratedString = null;
    }




    ////////////////////////////////////////
    // HELPERS
    ////////////////////////////////////////

    private static repeat(generateFunc: (fieldDescription: IDocumentFieldDescription []) => IGeneratedField[], fieldDescription: IDocumentFieldDescription[], size: number): any[] {
        let returnArr: any[] = []
        for(let i=0; i<size; i++){
            returnArr.push(generateFunc(fieldDescription));
        }

        return returnArr;
    }

    private static extractDefaultDescription(fieldDescription: IDocumentFieldDescription): IDefaultDocumentFieldDescription {
        return {
            fieldName: fieldDescription.fieldName,
            type: fieldDescription.type,
            nullPercentage: fieldDescription.nullPercentage,
        }
    }

    private static nextRandomDecimal(max: number): number {
        return Math.random() * Math.floor(max);
    }
    
    private static nextRandomDecimalBetween(min: number, max: number): number {
        return Math.random() * (min - max) + max;
    }

    private static nextRandomNumber(max: number): number {
        return Math.floor(Math.random() * Math.floor(max));
    }

    private static nextRandomNumberBetween(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
      
}