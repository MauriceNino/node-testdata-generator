import { IGeneratedCollection, IGeneratedField } from "../models/modelGenerated";

import sqlite3 from "sqlite3";
import { NodeTestdataGenerator } from "../core/worker";
export class Transformator {
    private static allDocumentsTransformed: number = 0;
    public static async transformTo(outputFormat: string, db: sqlite3.Database): Promise<void> {
        switch (outputFormat) {
            case "json":
                //JSON.stringify(generatedCollections).split("\n");
                break;
            case "sql":
                await Transformator.transformToSQL(db);
                break;
            case "mongodb":
                await Transformator.transformToMongo(db);
                break;
            default:
                throw new Error(`Output format '${outputFormat}' is not allowed. Check '--help' for help`);
        }
    }

    public static async transformToSQL(db: sqlite3.Database): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            db.serialize(() => {
                db.each("SELECT rowid as id, dbName, collectionName, value FROM temp_store", (err, row) => {
                    let tempColl: IGeneratedCollection = {
                        dbName: row.dbName,
                        collectionName: row.collectionName,
                        documents: JSON.parse(row.value)
                    }
                    
                    tempColl.documents.forEach(d => {
                        let singleInsert: string = `INSERT INTO ${tempColl.dbName}.${tempColl.collectionName} (`;
                        let isFirst: boolean = true;
                        d.documentFields.forEach(f => {
                            if(isFirst) isFirst = false;
                            else singleInsert += ", ";

                            singleInsert += f.fieldName;
                        })

                        singleInsert += ") VALUES (";

                        isFirst = true;
                        d.documentFields.forEach(f => {
                            if(isFirst) isFirst = false;
                            else singleInsert += ", ";

                            singleInsert += f.fieldNeedsQuotations?"'":"";
                            singleInsert += f.fieldValue;
                            singleInsert += f.fieldNeedsQuotations?"'":"";
                        })
                        singleInsert+=");";

                        Transformator.allDocumentsTransformed++;
                        NodeTestdataGenerator.updateProgressbar(Transformator.allDocumentsTransformed);
                        
                        Transformator.insertSingleInsert(db, singleInsert);
                    });
                    Transformator.deleteRow(db, row.id);
                }, () => {
                    resolve();
                });
            });
        });
    }
    
    public static async transformToMongo(db: sqlite3.Database): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            db.serialize(() => {
                db.each("SELECT rowid as id, dbName, collectionName, value FROM temp_store", (err, row) => {
                    let tempColl: IGeneratedCollection = {
                        dbName: row.dbName,
                        collectionName: row.collectionName,
                        documents: JSON.parse(row.value)
                    }


                    tempColl.documents.forEach((document) => {
                        let singleInsert: string = `${tempColl.dbName}.${tempColl.collectionName}.insert({`;

                        let isFirstField: boolean = true;
                        document.documentFields.forEach(f => {
                            let field: string = Transformator.transformSingleMongoField(f);

                            if(field != null) {
                                if(isFirstField) isFirstField = false;
                                else singleInsert += ", ";
            
                                singleInsert += field;
                            }
                        })

                        singleInsert += "});";

                        Transformator.allDocumentsTransformed++;
                        NodeTestdataGenerator.updateProgressbar(Transformator.allDocumentsTransformed);
                        
                        Transformator.insertSingleInsert(db, singleInsert);
                    });
                    Transformator.deleteRow(db, row.id);
                }, () => {
                    resolve();
                });
            });
        });
    }

    private static insertSingleInsert(db: sqlite3.Database, singleInsert: string) {
        db.serialize(() => {
            var stmt = db.prepare("INSERT INTO temp_out (`value`) VALUES ($stuff)");
            stmt.run({$stuff: singleInsert});
            stmt.finalize();
        });
    }

    private static deleteRow(db: sqlite3.Database, rowId: number) {
        var stmt = db.prepare("DELETE FROM temp_store WHERE rowid = $id");
        stmt.run({ $id: rowId });
        stmt.finalize();
    }

    private static transformSingleMongoField(field: IGeneratedField): string {
        if(field.fieldIsObject) {
            let isFirst: boolean = true;
            let returnStr: string = `"${field.fieldName}": {`;
            (field.fieldValue as IGeneratedField[]).forEach((f: IGeneratedField) => {
                if(isFirst) isFirst = false;
                else returnStr += ", ";

                returnStr += Transformator.transformSingleMongoField(f);
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
                
                if(!field.unboxElements)
                    returnStr += "{";

                arrField.forEach((arrField: any) => {
                    if(isFirstObj) isFirstObj = false;
                    else returnStr += ", "

                    if(field.unboxElements) {
                        if(field.fieldNeedsQuotations)
                            returnStr +=  `"${arrField.fieldValue}"`;
                        else
                            returnStr +=  arrField.fieldValue;
                    } else {
                        returnStr += Transformator.transformSingleMongoField(arrField);
                    }
                })
                if(!field.unboxElements)
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