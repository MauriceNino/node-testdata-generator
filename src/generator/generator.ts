import { IDefaultDocumentFieldDescription, IDocumentFieldDescription, ICollectionDescription } from "../models/modelInput";
import { IGeneratedField, IGeneratedCollection, IGeneratedDocument } from "../models/modelGenerated";
import { GeneratorTypes } from "../models/generatorTypes";

/// <reference path="../../node_modules/@types/faker/index.d.ts"/>
var faker: Faker.FakerStatic = require('faker');

export class Generator {
    
    public static generateCollection(collectionDescription: ICollectionDescription): IGeneratedCollection {
        let tempResultCollection: IGeneratedCollection = {
            dbName: collectionDescription.databaseName,
            collectionName: collectionDescription.collectionName,
            documents: []
        }

        for(let i=0; i<collectionDescription.documentsCount; i++) {
            let tempResultDocument: IGeneratedDocument = {
                documentFields: []
            }

            tempResultDocument.documentFields = Generator.generateFields(collectionDescription.documentDescription);

            tempResultCollection.documents.push(tempResultDocument);
        }

        Generator.collectionGenerationFinished();

        return tempResultCollection;
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
                let returnObj = {}
                //@ts-ignore
                returnObj[fieldDescription.positionNameX] = randomPos.long;
                //@ts-ignore
                returnObj[fieldDescription.positionNameY] = randomPos.lat;

                returnField.fieldValue = returnObj;
                returnField.fieldIsObject = true;
                break;
            case GeneratorTypes.Constant:
                returnField.fieldValue = fieldDescription.constantValue;
                break;
            case GeneratorTypes.Reference:
                throw new Error("Not implemented");
                break;
            case GeneratorTypes.Select:
                if(fieldDescription.fromArray[0] instanceof String) {
                    returnField.fieldNeedsQuotations = true;
                }
                returnField.fieldValue = Generator.generateSelect(defaultFieldDescription, fieldDescription.fromArray);
                break;
            case GeneratorTypes.Faker:
                //@ts-ignore
                returnField.fieldValue = faker[fieldDescription.namespaceName][fieldDescription.methodName]();
                break;
        }
        
        if(typeof returnField.fieldValue == "string" || returnField.fieldValue instanceof String) {
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
        return Math.random() * Math.floor(max);
    }

    private static nextRandomNumber(max: number): number {
        return Math.floor(Math.random() * Math.floor(max));
    }

    private static nextRandomNumberBetween(min: number, max: number): number {
        return Generator.nextRandomNumber(max - min +1) + min;
    }
      
}