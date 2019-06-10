import { CmdOpts, argsHandler, ICollectionDescription } from "../models/modelInput";
import { IGeneratedCollection } from "../models/modelGenerated";

import fs from 'fs'
import path from 'path'
import util from 'util';
import { Generator } from "../generator/generator";
import { Transformator } from "../transformator/transformator";


export class NodeTestdataGenerator {
    public static doWork (opts: CmdOpts): any[] {
        if(opts.createTemplate) NodeTestdataGenerator.writeTemplateToFile(opts.outputFilename);
        else {
            let collectionDescriptions: ICollectionDescription[] = JSON.parse(NodeTestdataGenerator.readData(opts.schemaFile));

            if(collectionDescriptions.length == 0) NodeTestdataGenerator.printOutput("warn", "Input file is empty!");

            let generatedCollections = Generator.parseCollectionDescriptions(collectionDescriptions);
            generatedCollections = Generator.resolveCollectionKeys(generatedCollections);

            return Transformator.transformTo(opts.outputFormat, generatedCollections, true);
        }
    }

    public static cmdDoWork (opts: CmdOpts): void {
        if(opts.printHelp) NodeTestdataGenerator.printHelp();
        else if(opts.createTemplate) NodeTestdataGenerator.writeTemplateToFile(opts.outputFilename);
        else {
            let collectionDescriptions: ICollectionDescription[] = JSON.parse(NodeTestdataGenerator.readData(opts.schemaFile));

            if(collectionDescriptions.length == 0) NodeTestdataGenerator.printOutput("warn", "Input file is empty!");

            let generatedCollections = Generator.parseCollectionDescriptions(collectionDescriptions);
            generatedCollections = Generator.resolveCollectionKeys(generatedCollections);

            let outputArr: string [];

            outputArr = Transformator.transformTo(opts.outputFormat, generatedCollections);

            if(opts.outputType == "cmd" && opts.outputFormat == "json") {
                console.log(util.inspect(generatedCollections, false, null, true));
            } else {
                switch(opts.outputType) {
                    case "cmd":
                        //console.log(util.inspect(generatedCollections, false, null, true));
                        outputArr.forEach(el => console.log(el));
                        break;
                    case "file":
                        NodeTestdataGenerator.writeToFile(opts.outputFilename, outputArr.join("\n"));
                        break;
                    default:
                        throw new Error(`Output Type '${opts.outputType}' is not allowed. Check '--help' for help`);
                }
            }
        }
    }

    static writeTemplateToFile(fileName: string): void {
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

    static writeToFile(fileName: string, content: string): void {
        fs.writeFileSync(fileName, content);

        NodeTestdataGenerator.printOutput("output", "Content written to file");
    }
    
    static createFile(fileName: string): number {
        return fs.openSync(fileName, 'w');
    }

    static readData(fileName: string): string {
        var buffer = fs.readFileSync(path.join(process.cwd(), fileName));
        return buffer.toString();
    }

    private static printHelp (): void {
        console.log(`[ \x1b[33mBasic Usage\x1b[0m ]`);
        console.log(`  \x1b[32mindex.js --createTemplate --fileName=template.json\x1b[0m         Generates basic template and writes it to template.json`);
        console.log(`  \x1b[32mindex.js --schema=template.json --of=JSON --f=result.json\x1b[0m  Generates test data from template.json and writes it to result.json in JSON format`);
        console.log(`  \x1b[32mindex.js --schema=template.json --of=SQL --f=result.json\x1b[0m   Generates test data from template.json and writes it to result.json in SQL format`);
        console.log(`  \x1b[32mindex.js --schema=template.json --db\x1b[0m                       Generates test data from template.json and writes it directly into the MongoDB`);
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

    static printOutput (loglevel: string, text: string) {
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