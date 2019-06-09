export interface ICollectionDescription {
    databaseName: string;        // The name of the database
    collectionName: string;      // The name of the collection/table

    documentsCount?: number;     // How many documents/rows it should generate
    documentsCountFrom?: number; // Rondom number for document cound (from & to required)
    documentsCountTo?: number;

    isDocumentStatic?: boolean;  // Does this document contain static content (for example a country list)
    injectIntoStatic?: boolean;  // Do you want to inject test data into the static content

    documentDescription?: IDocumentFieldDescription []; // Your schema for this document/table to generate data
    staticDocuments?: any [];    // Array of static documents/rows
}

export interface IDefaultDocumentFieldDescription {
    fieldName: string;
    type: string;
    
    nullPercentage?: number;
    nullPercentageFrom?: number;
    nullPercentageTo?: number;
}

export interface IDocumentFieldDescription {
    fieldName: string;
    type: string;
    
    nullPercentage?: number;

    // Types with no extra parameter:
    // jwt

    // Type string
    unique?: boolean;
    lengthFrom?: number;
    lengthTo?: number;

    // Type number, decimal (+ decimalPlaces)
    numberFrom?: number;
    numberTo?: number;

    maxDecimalPlaces?: number
    
    // Type autoIncrement
    autoIncrementStart?: number;
    autoIncrementSteps?: number;

    // Type boolean
    percentTrue?: number;

    // Type array, object (only subDocumentDescriptions)
    size?: number;
    sizeFrom?: number;
    sizeTo?: number;
    subDocumentDescriptions?: IDocumentFieldDescription [];

    // Type date
    dateFrom?: string;
    dateTo?: string;

    // Type position
    positionNameX?: string;
    positionNameY?: string;
    positionCenterCoordinates?: {long: number, lat: number};
    positionRadius?: number;

    // Type constant
    constantValue?: any;

    // Type reference 
    referenceTo?: number;
    referenceKey?: number;

    // Type select
    fromArray?: any[];

    // Type faker
    methodName?: string;
    namespaceName?: string;
}

export class CmdOpts {
    // File
    public createTemplate: boolean = false;
    public outputType: string = "cmd";
    public outputFilename: string;

    // Input
    public schemaFile: string;

    // Output Format
    public outputFormat: string = "json";

    // DB (only mongodb)
    public writeToDatabase: boolean = false;
    public databaseHost: string = "127.0.0.1";
    public databasePort: string = "27017";
    public databaseUsername: string;
    public databasePassword: string;

    // Help
    public printHelp: boolean;

    constructor () {}
}

export const argsHandler = [
    {
        group: 'Input',
        aliases: ['schema', 's', 'input', 'inp'],
        desc: "The input file of your schema",
        addFlag: (opts: CmdOpts, value: string) => opts.schemaFile = value
    },
    {
        group: 'Output',
        aliases: ['outputType', 'ot'],
        desc: "Where the output of the testdata should land to. Possible values [ file, cmd ]",
        addFlag: (opts: CmdOpts, value: string) => opts.outputType = value
    },
    {
        group: 'Output',
        aliases: ['outputFormat', 'of'],
        desc: "The output format of your test data. Possible values [ mongodb, sql, json ]",
        addFlag: (opts: CmdOpts, value: string) => opts.outputFormat = value
    },
    {
        group: 'Output',
        aliases: ['outputFile', 'out', 'o'],
        desc: "The filename where the template/outputFile should be stored. Requires --outputType to be 'file'.",
        addFlag: (opts: CmdOpts, value: string) => opts.outputFilename = value
    },
    {
        group: 'Output',
        aliases: ['createTemplate', 'template', 't'],
        desc: "Create a new Template file, requires '--outputFile=filename' flag to work",
        addFlag: (opts: CmdOpts, value: string) => opts.createTemplate = true
    },
    {
        group: 'MongoDB',
        aliases: ['writeToDatabase', 'db'],
        desc: "If it should write directly to the database (Only possible with MongoDB)",
        addFlag: (opts: CmdOpts, value: string) => opts.writeToDatabase = true
    },
    {
        group: 'MongoDB',
        aliases: ['databaseHost', 'host'],
        desc: "The host of your MongoDB instance (Defaults to 127.0.0.1)",
        addFlag: (opts: CmdOpts, value: string) => opts.databaseHost = value
    },
    {
        group: 'MongoDB',
        aliases: ['databasePort', 'port'],
        desc: "The port of your MongoDB instance (Defaults to 27017)",
        addFlag: (opts: CmdOpts, value: string) => opts.databasePort = value
    },
    {
        group: 'MongoDB',
        aliases: ['databaseUsername', 'username', 'un'],
        desc: "The username of your MongoDB instance",
        addFlag: (opts: CmdOpts, value: string) => opts.databaseUsername = value
    },
    {
        group: 'MongoDB',
        aliases: ['databasePassword', 'password', 'pass', 'pw'],
        desc: "The password of your MongoDB instance",
        addFlag: (opts: CmdOpts, value: string) => opts.databasePassword = value
    },
    {
        group: 'Help',
        aliases: ['printHelp', 'help', 'h'],
        desc: "print this screen",
        addFlag: (opts: CmdOpts, value: string) => opts.printHelp = true
    }
]
