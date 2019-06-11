import { CmdOpts, argsHandler, ICollectionDescription } from "../models/modelInput";
import { IGeneratedCollection } from "../models/modelGenerated";

import fs from 'fs'
import path, { resolve } from 'path'
import util from 'util';
import { Generator } from "../generator/generator";
import { Transformator } from "../transformator/transformator";

import sqlite3 from "sqlite3";
var db = new sqlite3.Database(':memory:');
  
export class NodeTestdataGenerator {
    public static async doWork (opts: CmdOpts): Promise<any[]> {
        if(opts.createTemplate) NodeTestdataGenerator.writeTemplateToFile(opts.outputFilename);
        else {
            let collectionDescriptions: ICollectionDescription[] = JSON.parse(NodeTestdataGenerator.readData(opts.schemaFile));

            if(collectionDescriptions.length == 0) NodeTestdataGenerator.printOutput("warn", "Input file is empty!");

            let dbConnection = await NodeTestdataGenerator.initializeInMemoryDatabase();

            await Generator.parseCollectionDescriptions(collectionDescriptions, 50, dbConnection);
            await Generator.resolveCollectionKeys(dbConnection);

            await Transformator.transformTo(opts.outputFormat, dbConnection);

            return;
        }
    }

    public static async cmdDoWork (opts: CmdOpts): Promise<void> {
        if(opts.printHelp) NodeTestdataGenerator.printHelp();
        else if(opts.createTemplate) NodeTestdataGenerator.writeTemplateToFile(opts.outputFilename);
        else {
            let collectionDescriptions: ICollectionDescription[] = JSON.parse(NodeTestdataGenerator.readData(opts.schemaFile));

            if(collectionDescriptions.length == 0) NodeTestdataGenerator.printOutput("warn", "Input file is empty!");

            let dbConnection = await NodeTestdataGenerator.initializeInMemoryDatabase();

            await Generator.parseCollectionDescriptions(collectionDescriptions, 50, dbConnection);
            await Generator.resolveCollectionKeys(dbConnection);

            if(opts.outputType == "cmd" && opts.outputFormat == "json") {
                db.serialize(() => {
                    db.each("SELECT dbName, collectionName, value FROM temp_store", function(err, row) {
                        let tempColl: IGeneratedCollection = {
                            dbName: row.dbName,
                            collectionName: row.collectionName,
                            documents: JSON.parse(row.value)
                        }
                        console.log(util.inspect(tempColl, false, null, true));
                    });
                });
            } else {
                await Transformator.transformTo(opts.outputFormat, dbConnection);

                switch(opts.outputType) {
                    case "cmd":
                        db.serialize(() => {
                            db.each("SELECT value FROM temp_out", (err, row) => {
                                console.log(row.value);
                            });
                        });
                        break;
                    case "file":
                        db.serialize(() => {
                            db.each("SELECT value FROM temp_out", (err, row) => {
                                NodeTestdataGenerator.appendToFile(opts.outputFilename, row.value)
                            });
                        });
                        break;
                    default:
                        throw new Error(`Output Type '${opts.outputType}' is not allowed. Check '--help' for help`);
                }
            }
        }

        //await NodeTestdataGenerator.destroyInMemoryDatabase();
    }

    private static async initializeInMemoryDatabase(): Promise<sqlite3.Database> {
        return new Promise<sqlite3.Database>((resolve, reject) => {
            db.serialize(() => {
                db.run("CREATE TABLE temp_store (dbName TEXT, collectionName TEXT, value JSON)", () => {
                    db.run("CREATE TABLE temp_out (value TEXT)", () => {
                        resolve(db);
                    });
                });
            });
        });
    }
    

    public static async destroyInMemoryDatabase() {
        return new Promise<sqlite3.Database>((resolve, reject) => {
            db.close(() => {
                resolve();
            });
        });
    }

    private static writeTemplateToFile(fileName: string): void {
        const template: string = `[
    {
        "databaseName": "db",
        "collectionName": "test",
        "size": 100,
        "documentDescription": {
            "testDocField": {
                "type": "string",
                "nullPercentage": 0,
                "id": 0,
                "lengthFrom": 0,
                "lengthTo": 10
            }
        }
    }
]`

        fs.writeFileSync(fileName, template);

        NodeTestdataGenerator.printOutput("output", "Template written to file");
    }

    private static writeToFile(fileName: string, content: string): void {
        fs.writeFileSync(fileName, content);

        NodeTestdataGenerator.printOutput("output", "Content written to file");
    }

    private static appendToFile(fileName: string, content: string): void {
        fs.appendFileSync(fileName, content);
    }
    
    private static createFile(fileName: string): number {
        return fs.openSync(fileName, 'w');
    }

    private static readData(fileName: string): string {
        var buffer = fs.readFileSync(path.join(process.cwd(), fileName));
        return buffer.toString();
    }

    private static printHelp (): void {
        console.log(`[ \x1b[33mBasic Usage\x1b[0m ]`);
        console.log(`  \x1b[32mnode-testdata-generator --createTemplate --fileName=template.json\x1b[0m         Generates basic template and writes it to template.json`);
        console.log(`  \x1b[32mnode-testdata-generator --schema=template.json --of=JSON --f=result.json\x1b[0m  Generates test data from template.json and writes it to result.json in JSON format`);
        console.log(`  \x1b[32mnode-testdata-generator --schema=template.json --of=SQL --f=result.json\x1b[0m   Generates test data from template.json and writes it to result.json in SQL format`);
        console.log(`  \x1b[32mnode-testdata-generator --schema=template.json --db\x1b[0m                       Generates test data from template.json and writes it directly into the MongoDB`);
        console.log(``);
        
        const maxes: number [] = [
            Math.max(...argsHandler.map((singleArgsHandler) => singleArgsHandler.aliases.join(", ").length)),
            Math.max(...argsHandler.map((singleArgsHandler) => singleArgsHandler.desc.length))
        ]
        console.log(`[ \x1b[33mCommand Details\x1b[0m ]`);
        //@ts-ignore
        let groupedHelp: Map<string, any[]> = NodeTestdataGenerator.groupArrayBy(argsHandler, x => x.group);
        
        groupedHelp.forEach((g)=>{
            console.log(`[ \x1b[33m${g[0].group}\x1b[0m ]`);
            g.forEach((argsHandle) => {
                let aliase: string = argsHandle.aliases.join("\x1b[0m, \x1b[32m");
                let desc: string = argsHandle.desc;
                let spaces: string = " ".repeat(maxes[0]-argsHandle.aliases.join(', ').length);
    
                console.log(`[ \x1b[32m${aliase}\x1b[0m ] ${spaces}  ${desc}`);
            });
            console.log(``);
        })
    }

    private static groupArrayBy(arr: [], grouper: any) {
        const map = new Map();
        arr.forEach((item) => {
            const key = grouper(item);
            const collection = map.get(key);
            if (!collection) {
                map.set(key, [item]);
            } else {
                collection.push(item);
            }
        });
        return map;
    }

    private static printOutput (loglevel: string, text: string) {
        if(loglevel == "output")
            console.log(`\x1b[0m[ \x1b[32mOutput\x1b[0m ]  ${text}`);
        if(loglevel == "info")
            console.log(`\x1b[0m[ \x1b[34mOutput\x1b[0m ]  ${text}`);
        if(loglevel == "warn")
            console.log(`\x1b[0m[ \x1b[33mOutput\x1b[0m ]  ${text}`);
        if(loglevel == "error")
            console.log(`\x1b[0m[ \x1b[31mError\x1b[0m ]  ${text}`);
    }
}