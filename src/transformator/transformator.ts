import { IGeneratedCollection, IGeneratedField } from "../models/modelGenerated";

export class Transformator {

    public static transformTo(outputFormat: string, generatedCollections: IGeneratedCollection[], keepJson: boolean = false): any[] {

        let outputArr: string [];
        switch (outputFormat) {
            case "json":
                if(keepJson)
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
                throw new Error(`Output format '${outputFormat}' is not allowed. Check '--help' for help`);
        }
        return outputArr;
    }

    public static transformToSQL(collections: IGeneratedCollection[]): string [] {
        let resultArr: string[] = [];

        collections.forEach(collection => {

            collection.documents.forEach(document => {
                let singleInsert: string = `INSERT INTO ${collection.dbName}.${collection.collectionName} (`;
                let isFirst: boolean = true;
                document.documentFields.forEach(f => {
                    if(isFirst) isFirst = false;
                    else singleInsert += ", ";

                    singleInsert += f.fieldName;
                })

                singleInsert += ") VALUES (";

                isFirst = true;
                document.documentFields.forEach(f => {
                    if(isFirst) isFirst = false;
                    else singleInsert += ", ";

                    singleInsert += f.fieldNeedsQuotations?"'":"";
                    singleInsert += f.fieldValue;
                    singleInsert += f.fieldNeedsQuotations?"'":"";
                })
                singleInsert+=");";
                resultArr.push(singleInsert);
            })

        })

        return resultArr;
    }
    
    public static transformToMongo(collections: IGeneratedCollection[], bulkinsertMax: number): string [] {
        let resultArr: string[] = [];

        collections.forEach(collection => {
            let singleInsert: string = `${collection.dbName}.${collection.collectionName}.insert(`;

            let isFirstDoc: boolean = true;
            collection.documents.forEach((document, index) => {
                if(index % bulkinsertMax == 0 && index != 0 && index < collection.documents.length) {
                    singleInsert += ");";
                    resultArr.push(singleInsert);

                    singleInsert = `${collection.dbName}.${collection.collectionName}.insert(`;

                    isFirstDoc = true;
                }
                
                if(isFirstDoc) isFirstDoc = false;
                else singleInsert += ", ";

                singleInsert += "{";

                let isFirstField: boolean = true;
                document.documentFields.forEach(f => {
                    let field: string = Transformator.transforSingleMongoField(f);

                    if(field != null) {
                        if(isFirstField) isFirstField = false;
                        else singleInsert += ", ";
    
                        singleInsert += Transformator.transforSingleMongoField(f);
                    }
                })

                singleInsert += "}";

            })

            singleInsert+=");";
            resultArr.push(singleInsert);
        })
        return resultArr;
    }

    private static transforSingleMongoField(field: IGeneratedField): string {
        if(field.fieldIsObject) {
            let isFirst: boolean = true;
            let returnStr: string = `"${field.fieldName}": {`;
            (field.fieldValue as IGeneratedField[]).forEach((f: IGeneratedField) => {
                if(isFirst) isFirst = false;
                else returnStr += ", ";

                returnStr += Transformator.transforSingleMongoField(f);
            })
            
            returnStr += "}";

            return returnStr;
        }
        if(field.fieldIsArray) {
            if(field.fieldValue == 0) return null;
            
            let isFirst: boolean = true;
            let returnStr: string = `"${field.fieldName}": [`;
            (field.fieldValue as any[]).forEach((arrField: any) => {
                if(isFirst) isFirst = false;
                else returnStr += ", "


                let isFirstObj: boolean = true;
                returnStr += "{";
                arrField.forEach((arrField: any) => {
                    if(isFirstObj) isFirstObj = false;
                    else returnStr += ", "
                    returnStr += Transformator.transforSingleMongoField(arrField);
                })
                returnStr += "}";
            });
            
            returnStr += "]";

            return returnStr;
        }
        if(field.fieldIsJsonObject) {
            let returnStr: string = `"${field.fieldName}": ${JSON.stringify(field.fieldValue)}`;
            return returnStr;
        }

        if(field.fieldValue == null ) return null;

        if(field.fieldNeedsQuotations)
            return `"${field.fieldName}": "${field.fieldValue}"`;
        else
            return `"${field.fieldName}": ${field.fieldValue}`;
    }
}