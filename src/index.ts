import { CmdOpts, argsHandler } from "./models/modelInput";
import { NodeTestdataGenerator } from "./core/worker";

const cmdOpts = process.argv;
const nodePath = cmdOpts[0];
const indexPath = cmdOpts[1];
const args = cmdOpts.slice(2);



function main(args: string[]) {
    if(args.length == 0) {
        throw new Error("There needs to be at least 1 parameter for this to work!");
    }


    let opts: CmdOpts = new CmdOpts();

    args.forEach((arg) => {
        let argArr: string[] = arg.replace(/^-+/g, '').split('=');

        if(argArr.length > 2) {
            throw new Error(`Argument '${arg}' has too many values. Type node 'index.js --help' for help about commands!`);
        }

        let handleArg = argsHandler.find(a => a.aliases.indexOf(argArr[0]) !== -1);

        if(handleArg === undefined) {
            throw new Error(`Argument '${arg}' does not exist. Type node 'index.js --help' for help about commands!`);
        }

        if(argArr.length == 2) {
            handleArg.addFlag(opts, argArr[1]);
        } else {
            handleArg.addFlag(opts, '');
        }

    });

    if(opts.createTemplate && (opts.writeToDatabase || opts.outputFilename != null)) {
        throw new Error(`You cant write a templete file while writing an output file or connecting to the database!`);
    }

    if(opts.writeToDatabase && (opts.databaseHost === undefined || opts.databasePort === undefined)) {
        throw new Error(`You cant write a templete file and an output file simultaniously!`);
    }

    NodeTestdataGenerator.cmdDoWork(opts);
}

main(args);