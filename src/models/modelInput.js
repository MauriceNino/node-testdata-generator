"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CmdOpts = /** @class */ (function () {
    function CmdOpts() {
        // File
        this.createTemplate = false;
        this.outputType = "cmd";
        // Output Format
        this.outputFormat = "json";
        // DB (only mongodb)
        this.writeToDatabase = false;
        this.databaseHost = "127.0.0.1";
        this.databasePort = "27017";
    }
    return CmdOpts;
}());
exports.CmdOpts = CmdOpts;
exports.argsHandler = [
    {
        group: 'Input',
        aliases: ['schema', 's', 'input', 'inp'],
        desc: "The input file of your schema",
        addFlag: function (opts, value) { return opts.schemaFile = value; }
    },
    {
        group: 'Output',
        aliases: ['outputType', 'ot'],
        desc: "Where the output of the testdata should land to. Possible values [ file, cmd ]",
        addFlag: function (opts, value) { return opts.outputType = value; }
    },
    {
        group: 'Output',
        aliases: ['outputFormat', 'of'],
        desc: "The output format of your test data. Possible values [ mongodb, sql, json ]",
        addFlag: function (opts, value) { return opts.outputFormat = value; }
    },
    {
        group: 'Output',
        aliases: ['outputFile', 'out', 'o'],
        desc: "The filename where the template/outputFile should be stored. Requires --outputType to be 'file'.",
        addFlag: function (opts, value) { return opts.outputFilename = value; }
    },
    {
        group: 'Output',
        aliases: ['createTemplate', 'template', 't'],
        desc: "Create a new Template file, requires '--outputFile=filename' flag to work",
        addFlag: function (opts, value) { return opts.createTemplate = true; }
    },
    {
        group: 'MongoDB',
        aliases: ['writeToDatabase', 'db'],
        desc: "If it should write directly to the database (Only possible with MongoDB)",
        addFlag: function (opts, value) { return opts.writeToDatabase = true; }
    },
    {
        group: 'MongoDB',
        aliases: ['databaseHost', 'host'],
        desc: "The host of your MongoDB instance (Defaults to 127.0.0.1)",
        addFlag: function (opts, value) { return opts.databaseHost = value; }
    },
    {
        group: 'MongoDB',
        aliases: ['databasePort', 'port'],
        desc: "The port of your MongoDB instance (Defaults to 27017)",
        addFlag: function (opts, value) { return opts.databasePort = value; }
    },
    {
        group: 'MongoDB',
        aliases: ['databaseUsername', 'username', 'un'],
        desc: "The username of your MongoDB instance",
        addFlag: function (opts, value) { return opts.databaseUsername = value; }
    },
    {
        group: 'MongoDB',
        aliases: ['databasePassword', 'password', 'pass', 'pw'],
        desc: "The password of your MongoDB instance",
        addFlag: function (opts, value) { return opts.databasePassword = value; }
    },
    {
        group: 'Help',
        aliases: ['printHelp', 'help', 'h'],
        desc: "print this screen",
        addFlag: function (opts, value) { return opts.printHelp = true; }
    }
];
