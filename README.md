
# node-testdata-generator
Generates configurable testdata with a predefined schema. 
# Features
- Generate basic data like String, Number, autoIncrement, ObjectId, ...
- Generate fake data with [Faker.js](https://github.com/marak/Faker.js/) 
- Supports a high amount of data due to integration with a In Memory database during creation
- Create references between the data
- Automatically get the data outputted in SQL or MongoDB formatted insert statements
# How to use it
To use it you have several options. You can use it from the command line or from other code as a package.
## Command line
Install the package like this:

    npm install -g @mauricenino/node-testdata-generator
    
And then call it like this:

    node-testdata-generator help

This will print the help page:

    [ Basic Usage ]
      node-testdata-generator --createTemplate --fileName=template.json         Generates basic template and writes it to template.json
      node-testdata-generator --schema=template.json --of=JSON --f=result.json  Generates test data from template.json and writes it to result.json in JSON format
      node-testdata-generator --schema=template.json --of=SQL --f=result.json   Generates test data from template.json and writes it to result.json in SQL format
      node-testdata-generator --schema=template.json --db                       Generates test data from template.json and writes it directly into the MongoDB
    
    [ Command Details ]
    [ Input ]
    [ schema, s, input, inp ]                  The input file of your schema
    
    [ Output ]
    [ outputType, ot ]                         Where the output of the testdata should land to. Possible values [ file, cmd ]
    [ outputFormat, of ]                       The output format of your test data. Possible values [ mongodb, sql, json ]
    [ outputFile, out, o ]                     The filename where the template/outputFile should be stored. Requires --outputType to be 'file'.
    [ createTemplate, template, t ]            Create a new Template file, requires '--outputFile=filename' flag to work
    
    [ MongoDB ]
    [ writeToDatabase, db ]                    If it should write directly to the database (Only possible with MongoDB)
    [ databaseHost, host ]                     The host of your MongoDB instance (Defaults to 127.0.0.1)
    [ databasePort, port ]                     The port of your MongoDB instance (Defaults to 27017)
    [ databaseUsername, username, un ]         The username of your MongoDB instance
    [ databasePassword, password, pass, pw ]   The password of your MongoDB instance
    
    [ Help ]
    [ printHelp, help, h ]                     print this screen

You can use the parameters in any form you like, it makes no difference.
These are all the same:
- `node-testdata-generator --help`
- `node-testdata-generator help`
- `node-testdata-generator -h`
- `node-testdata-generator h`

### Example call from command line
This will read the schema from schema.json that is in the parent folden, generate the testdata, transform it to MongoDB insert statements and write them to script.js:

    node-testdata-generator --schema="../schema.json" --of=mongodb --ot=file --out=script.js
    
This will read the schema from schema.json that is in the parent folden, generate the testdata, transform it to SQL insert statements and write them to script.js:

    node-testdata-generator --schema="../schema.json" --of=sql --ot=file --out=script.js

## Usage in code // Not yet fully implemented
It kinda works like in the command line, but you have to put in the parameters manually and read the output manually:

First of all, install the package in your project like this:

    npm install --save node-testdata-generator
    
And then import it like this:

    import { NodeTestdataGenerator } from 'node-testdata-generator/dist/core/worker';
    import { CmdOpts } from 'node-testdata-generator/dist/models/modelInput';
    
After that you can call it like so:

    let opts: CmdOpts = new CmdOpts();
    opts.schemaFile = "../schema.json";
    opts.outputFormat= "mongodb";
    
    NodeTestdataGenerator.doWork(opts).then((dataHandle) => {
		// Query through the dataHandle (data is shipped asynchronously due to potential RAM leak)

        // After you are done, destroy the in memory database to free up resources
        NodeTestdataGenerator.destroyInMemoryDatabase();
	});

# Schema file configuration
The basic schema with the required fields looks like this:

    [
	    {
	        "databaseName": "db",       // Name of the database
	        "collectionName": "users",  // Name of the collection (table in SQL)
	        "documentsCount": 2,        // Number of documents to create (rows in SQL)
	        "documentDescription": [    // Description of the fields (columns in SQL)
		        // Descriptions of fields
	        ]
	    },
		// More collection descriptions
	]

The basic sctucture of a field (column in SQL) is as following

    {
        "fieldName": "_id",  // The name of the field
        "type": "objectId",  // The type of the field
        "nullPercentage": 0, // The chance that the field is null
    }
## Static document injections

If you want to have some static content (for example a language list) in your testdata that is linked with other data you can archieve this by injecting the generated data into the static data like this:

    {
        "databaseName": "db",
        "collectionName": "languages",
        "documentsCount": 2,
        "documentDescription": [  // The generated data that gets injected into the static data
            {
                "fieldName": "_id",
                "type": "objectId",
                "nullPercentage": 0,
                "referenceKey": 1
            }
        ],
        "isDocumentStatic": true,  // If there is static content in this document
        "injectIntoStatic": true,  // If you want to inject data from documentDescription into the static content
        "staticDocuments": [       // The array of static documents in json format       
            {"code":"ab","name":"Abkhaz","nativeName":"аҧсуа"}, {"code":"aa","name":"Afar","nativeName":"Afaraf"}, {"code":"af","name":"Afrikaans","nativeName":"Afrikaans"}
        ]
    }
    
The above snippet is used and executed in a snippet below in the Examples section!

## Different schema file types
### List of types
- string
- number
- decimal
- autoIncrement
- boolean
- boolean
- array
- object
- date
- position
- constant
- objectId
- referenceFrom & referenceTo
- select
- faker

### List of examples for types
Here are a few examples of the different types with real (fake) data.

Keep in mind that every type here is case sensitive.
### string

     {
		"fieldName": "userSecret",
		"type": "string",
		"nullPercentage": 0,
		"lengthFrom": 20,  // Minimum string length
		"lengthTo": 25     // Maximum string length
	}
### number

     {
		"fieldName": "userAge",
		"type": "number",
		"nullPercentage": 0,
		"numberFrom": 18,  // Minimum number
		"numberTo": 50     // Maximum number
	}
### decimal

     {
		"fieldName": "cash",
		"type": "number",
		"nullPercentage": 0,
		"numberFrom": 18.5,    // Minimum decimal
		"numberTo": 50.3       // Maximum decimal
		"maxDecimalPlaces": 2  // Maximum decimal places (cash is 2 because there are only 2 places in euro)
	}
### autoIncrement
	{
		"fieldName": "index",
		"type": "autoIncrement",
		"nullPercentage": 0,
		"autoIncrementStart": 0, // Starts at index 0
		"autoIncrementSteps": 1  // Increments by 1 on every element
	}
### boolean
	{
		"fieldName": "isAdmin",
		"type": "boolean",
		"nullPercentage": 0,
		"percentTrue": 10  // Only 10% of the items get true as a value
	}
### boolean
	{
		"fieldName": "isAdmin",
		"type": "boolean",
		"nullPercentage": 0,
		"percentTrue": 10  // Only 10% of the items get true as a value
	}
### array
With dynamic size:

    {
    	"fieldName": "dynamicSize3to5",
    	"type": "array",
    	"nullPercentage": 0,
    	"sizeFrom": 3,  // Minumum size of array
    	"sizeTo": 5,    // Maximum size of array
    	"unboxElements": true        // When there is only 1 element description it can be 
						    	     // This results in a loss of the fieldName thoughunboxed 
						    	     // Ex: ([{"number" 1}, ...] => [1, ...]) 
    	"subDocumentDescriptions": [ // Description of its elements
    		{
    			"fieldName": "number",
    			"type": "number",
    			"nullPercentage": 0,
    			"numberFrom": 1,
    			"numberTo": 1
    		}
    	]
    }
    
 With static size:
 
    {
    	"fieldName": "staticSize2",
    	"type": "array",
    	"nullPercentage": 0,
    	"size": 2,                    // Static size
    	"subDocumentDescriptions": [
    		{
    			"fieldName": "number",
    			"type": "number",
    			"nullPercentage": 0,
    			"numberFrom": 1,
    			"numberTo": 1
    		}
    	]
    }
    
### object
	{
		"fieldName": "userMainHobby",
		"type": "object",
		"nullPercentage": 0,
		"subDocumentDescriptions": [ // Descriptions for sub elements
			{
				"fieldName": "hobbyName",
				"type": "string",
				"nullPercentage": 0,
				"lengthFrom": 20,
				"lengthTo": 25
			},

			{
				"fieldName": "doHobbyInHours",
				"type": "number",
				"nullPercentage": 0,
				"numberFrom": 5,
				"numberTo": 20
			}
		]
	}
### date
	{
        "fieldName": "joinDate",
        "type": "date",
        "nullPercentage": 0,
        "dateFrom": "2018-01-01T00:00:00+00:00", // Date between from
        "dateTo": "2019-01-01T00:00:00+00:00"	 // Date between to
    }
### position
	{
		"fieldName": "someRandomPosition",
		"type": "position",
		"nullPercentage": 0,
		"positionCenterCoordinates": { // The center of the possible position values
			"long": 32,
			"lat": -32
		},
		"positionRadius": 10,   // The max distance away from positionCenterCoordinates
		"positionNameX": "X",   // The name of the X coordinate in the final object
		"positionNameY": "Y"    // The name of the Y coordinate in the final object
	}
### constant
	{
		"fieldName": "const",
		"type": "constant",
		"nullPercentage": 0,
		"constantValue": "test" // Value of the constant
	}
### objectId
No additional fields needed. Generates a unique ObjectId for MongoDB.

	{
		"fieldName": "_id",
		"type": "objectId",
		"nullPercentage": 0
	}
### referenceFrom & referenceTo
Every referenceFrom Element will copy the value of a random element with referenceKey of the same id.

Look at this example with id `0`:

	{
		"fieldName": "_id",
		"type": "objectId",
		"nullPercentage": 0,
		"referenceKey": 0    // give a referenceKey to any object you would like
							 // (for example objectId for MongoDB or autoIncrement for SQL)
	},
	{
		"fieldName": "bestFriend",
		"type": "referenceTo",   // Of type referenceTo
		"nullPercentage": 0,
		"referenceTo": 0         // Needs the referenceTo setting with the referenceKey id specified
	}

This example will write the value (In this example a objectId) of a random element with `"referenceKey": 0` in the `bestFriends` field.

### select

	{
        "fieldName": "randomStrSelected",
        "type": "select",
        "nullPercentage": 0,
        "fromArray": [     // Array of stuff it randomly picks from
            "test", "stuff"
        ]
    },
    
If you want to pick from random objects use it like this:
	
    {
        "fieldName": "randomStrSelected",
        "type": "select",
        "nullPercentage": 0,
	    "selectFromObjects": true,  // Flag to notify that the content are objects            
        "fromArray": [              // Array of stuff it randomly picks from
            {"test": 0},
            {"test": 1}
        ]
    },

### faker
Uses the [Faker.js](https://github.com/marak/Faker.js/) library. You can use all of its [available methods](https://github.com/marak/Faker.js/#api-methods). For more information about method parameters [check out this file](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/faker/index.d.ts).
   
    {
        "fieldName": "fake",
        "type": "faker",
        "namespaceName": "lorem",  // The name of the namespace (the first level in the list below)
        "methodName": "sentence", // The name of the method (Second level of the list below)
        "methodParams": [5, 2],   // The parameters of the method (Check the file linked above)
        "nullPercentage": 50
    },
#### Faker.js methods:
-   address
    -   zipCode
    -   city
    -   cityPrefix
    -   citySuffix
    -   streetName
    -   streetAddress
    -   streetSuffix
    -   streetPrefix
    -   secondaryAddress
    -   county
    -   country
    -   countryCode
    -   state
    -   stateAbbr
    -   latitude
    -   longitude
-   commerce
    -   color
    -   department
    -   productName
    -   price
    -   productAdjective
    -   productMaterial
    -   product
-   company
    -   suffixes
    -   companyName
    -   companySuffix
    -   catchPhrase
    -   bs
    -   catchPhraseAdjective
    -   catchPhraseDescriptor
    -   catchPhraseNoun
    -   bsAdjective
    -   bsBuzz
    -   bsNoun
-   database
    -   column
    -   type
    -   collation
    -   engine
-   date
    -   past
    -   future
    -   between
    -   recent
    -   soon
    -   month
    -   weekday
-   fake
-   finance
    -   account
    -   accountName
    -   mask
    -   amount
    -   transactionType
    -   currencyCode
    -   currencyName
    -   currencySymbol
    -   bitcoinAddress
    -   ethereumAddress
    -   iban
    -   bic
-   hacker
    -   abbreviation
    -   adjective
    -   noun
    -   verb
    -   ingverb
    -   phrase
-   helpers
    -   randomize
    -   slugify
    -   replaceSymbolWithNumber
    -   replaceSymbols
    -   shuffle
    -   mustache
    -   createCard
    -   contextualCard
    -   userCard
    -   createTransaction
-   image
    -   image
    -   avatar
    -   imageUrl
    -   abstract
    -   animals
    -   business
    -   cats
    -   city
    -   food
    -   nightlife
    -   fashion
    -   people
    -   nature
    -   sports
    -   technics
    -   transport
    -   dataUri
-   internet
    -   avatar
    -   email
    -   exampleEmail
    -   userName
    -   protocol
    -   url
    -   domainName
    -   domainSuffix
    -   domainWord
    -   ip
    -   ipv6
    -   userAgent
    -   color
    -   mac
    -   password
-   lorem
    -   word
    -   words
    -   sentence
    -   slug
    -   sentences
    -   paragraph
    -   paragraphs
    -   text
    -   lines
-   name
    -   firstName
    -   lastName
    -   findName
    -   jobTitle
    -   prefix
    -   suffix
    -   title
    -   jobDescriptor
    -   jobArea
    -   jobType
-   phone
    -   phoneNumber
    -   phoneNumberFormat
    -   phoneFormats
-   random
    -   number
    -   float
    -   arrayElement
    -   objectElement
    -   uuid
    -   boolean
    -   word
    -   words
    -   image
    -   locale
    -   alphaNumeric
    -   hexaDecimal
-   system
    -   fileName
    -   commonFileName
    -   mimeType
    -   commonFileType
    -   commonFileExt
    -   fileType
    -   fileExt
    -   directoryPath
    -   filePath
    -   semver
## Example schema files
### A Test for all the available types:
<details>
  <summary>View schema file</summary>

      [
        {
            "databaseName": "db",
            "collectionName": "users",
            "documentsCount": 3,
            "documentDescription": [
                
                {
                    "fieldName": "_id",
                    "type": "objectId",
                    "nullPercentage": 0,
                    "referenceKey": 0
                },
                {
                    "fieldName": "userSecret",
                    "type": "string",
                    "nullPercentage": 0,
                    "lengthFrom": 20,
                    "lengthTo": 25
                },
                
                {
                    "fieldName": "userAge",
                    "type": "number",
                    "nullPercentage": 0,
                    "numberFrom": 18,
                    "numberTo": 50
                },
                
                {
                    "fieldName": "userMainHobby",
                    "type": "object",
                    "nullPercentage": 0,
                    "subDocumentDescriptions": [
                        {
                            "fieldName": "hobbyName",
                            "type": "string",
                            "nullPercentage": 0,
                            "lengthFrom": 20,
                            "lengthTo": 25
                        },
                
                        {
                            "fieldName": "doHobbyInHours",
                            "type": "number",
                            "nullPercentage": 0,
                            "numberFrom": 5,
                            "numberTo": 20
                        }
                    ]
                },
                
                {
                    "fieldName": "incrementedStuff",
                    "type": "array",
                    "nullPercentage": 0,
                    "size": 5,
                    "subDocumentDescriptions": [
                        {
                            "fieldName": "number",
                            "type": "autoIncrement",
                            "nullPercentage": 0,
                            "autoIncrementStart": 100,
                            "autoIncrementSteps": 11
                        }
                    ]
                },
                
                {
                    "fieldName": "cash",
                    "type": "decimal",
                    "nullPercentage": 0,
                    "numberFrom": 100,
                    "numberTo": 5000,
                    "maxDecimalPlaces": 2
                },
                
                {
                    "fieldName": "isAdmin",
                    "type": "boolean",
                    "nullPercentage": 0,
                    "percentTrue": 10
                },
                
                {
                    "fieldName": "joinDate",
                    "type": "date",
                    "nullPercentage": 0,
                    "dateFrom": "2018-01-01T00:00:00+00:00",
                    "dateTo": "2019-01-01T00:00:00+00:00"
                },
                
                {
                    "fieldName": "const",
                    "type": "constant",
                    "nullPercentage": 0,
                    "constantValue": "test"
                },
                
                {
                    "fieldName": "const2",
                    "type": "constant",
                    "nullPercentage": 0,
                    "constantValue": {
                        "test": 1
                    }
                },
                
                {
                    "fieldName": "randomStrSelected",
                    "type": "select",
                    "nullPercentage": 0,
                    "fromArray": [
                        "test", "stuff"
                    ]
                },
                
                {
                    "fieldName": "someRandomPosition",
                    "type": "position",
                    "nullPercentage": 0,
                    "positionCenterCoordinates": {
                        "long": 32,
                        "lat": -32
                    },
                    "positionRadius": 10,
                    "positionNameX": "X",
                    "positionNameY": "Y"
                },
                
                {
                    "fieldName": "mightBeNull",
                    "type": "decimal",
                    "nullPercentage": 50,
                    "numberFrom": 1,
                    "numberTo": 2,
                    "maxDecimalPlaces": 2
                },
                
                {
                    "fieldName": "oneArrayWithDynamicSizeAndOneWithout",
                    "type": "object",
                    "nullPercentage": 0,
                    "subDocumentDescriptions": [
                        {
                            "fieldName": "dynamicSize3to5",
                            "type": "array",
                            "nullPercentage": 0,
                            "sizeFrom": 3,
                            "sizeTo": 5,
                            "subDocumentDescriptions": [
                                {
                                    "fieldName": "number",
                                    "type": "number",
                                    "nullPercentage": 0,
                                    "numberFrom": 1,
                                    "numberTo": 1
                                }
                            ]
                        },
                
                        {
                            "fieldName": "staticSize2",
                            "type": "array",
                            "nullPercentage": 0,
                            "size": 2,
                            "subDocumentDescriptions": [
                                {
                                    "fieldName": "number",
                                    "type": "number",
                                    "nullPercentage": 0,
                                    "numberFrom": 1,
                                    "numberTo": 1
                                }
                            ]
                        }
                    ]
                },
                
                {
                    "fieldName": "fake",
                    "type": "faker",
                    "namespaceName": "name",
                    "methodName": "findName",
                    "nullPercentage": 50
                },
                
                {
                    "fieldName": "bestFriend",
                    "type": "referenceTo",
                    "nullPercentage": 0,
                    "referenceTo": 0
                }
            ]
        }
    ]

</details>

Output of the schema file when executed with following command:

    > node index.js schema="../samples/alltypes_temp_test.json" of=mongodb ot=cmd

    db.users.insert({"_id": new ObjectId("5cfed9b01f1d666a06e0ce3a"), "userSecret": "1AJKOWFFiFPPkAQzkjzMjIy", "userAge": 26, "userMainHobby": {"hobbyName": "IKuNTkyPuKzoQTxZQJjLR0", "doHobbyInHours": 12}, "incrementedStuff": [{"number": 100}, {"number": 111}, {"number": 122}, {"number": 133}, {"number": 144}], "cash": 2703.55, "isAdmin": false, "joinDate": "2018-11-14T01:39:29.538Z", "const": "test", "const2": [object Object], "randomStrSelected": "stuff", "someRandomPosition": {"X": -24.936419257128584, "Y": 39.063580742871416}, "oneArrayWithDynamicSizeAndOneWithout": {"dynamicSize3to5": [{"number": 1}, {"number": 1}, {"number": 1}, {"number": 1}], "staticSize2": [{"number": 1}, {"number": 1}]}, "bestFriend": new ObjectId("5cfed9b01f1d666a06e0ce3a")});
    db.users.insert({"_id": new ObjectId("5cfed9b01f1d666a06e0ce3b"), "userSecret": "BkkhSum64AyviL6ao6zEROj", "userAge": 21, "userMainHobby": {"hobbyName": "cN7rDi4ehg59azaJoIjS", "doHobbyInHours": 9}, "incrementedStuff": [{"number": 155}, {"number": 166}, {"number": 177}, {"number": 188}, {"number": 199}], "cash": 1225.38, "isAdmin": false, "joinDate": "2018-05-29T12:27:51.183Z", "const": "test", "const2": [object Object], "randomStrSelected": "test", "someRandomPosition": {"X": -34.92541480647668, "Y": 29.07458519352332}, "mightBeNull": 1.12, "oneArrayWithDynamicSizeAndOneWithout": {"dynamicSize3to5": [{"number": 1}, {"number": 1}, {"number": 1}], "staticSize2": [{"number": 1}, {"number": 1}]}, "bestFriend": new ObjectId("5cfed9b01f1d666a06e0ce3a")});
    db.users.insert({"_id": new ObjectId("5cfed9b01f1d666a06e0ce3c"), "userSecret": "ddMkPG5LgMwvDMCxV7Sh", "userAge": 42, "userMainHobby": {"hobbyName": "SQtLn5BOBKGvGaSVnVh8IFUo", "doHobbyInHours": 19}, "incrementedStuff": [{"number": 210}, {"number": 221}, {"number": 232}, {"number": 243}, {"number": 254}], "cash": 4282.33, "isAdmin": false, "joinDate": "2018-07-20T06:22:35.524Z", "const": "test", "const2": [object Object], "randomStrSelected": "stuff", "someRandomPosition": {"X": -29.5, "Y": 34.5}, "oneArrayWithDynamicSizeAndOneWithout": {"dynamicSize3to5": [{"number": 1}, {"number": 1}, {"number": 1}], "staticSize2": [{"number": 1}, {"number": 1}]}, "fake": "Jovany Nolan", "bestFriend": new ObjectId("5cfed9b01f1d666a06e0ce3a")});

### A Test for linking between sql tables:

<details>
  <summary>View schema file</summary>

    [
        {
            "databaseName": "db",
            "collectionName": "users",
            "documentsCount": 10,
            "documentDescription": [        
                {
                    "fieldName": "userid",
                    "type": "autoIncrement",
                    "nullPercentage": 0,
                    "autoIncrementStart": 0,
                    "autoIncrementSteps": 1,
                    "referenceKey": 0
                },    
                {
                    "fieldName": "username",
                    "type": "faker",
                    "namespaceName": "name",
                    "methodName": "findName",
                    "nullPercentage": 0
                }
            ]
        },
        {
            "databaseName": "db",
            "collectionName": "groups",
            "documentsCount": 2,
            "documentDescription": [
                {
                    "fieldName": "groupid",
                    "type": "autoIncrement",
                    "nullPercentage": 0,
                    "autoIncrementStart": 0,
                    "autoIncrementSteps": 1,
                    "referenceKey": 1
                },    
                {
                    "fieldName": "groupname",
                    "type": "string",
                    "nullPercentage": 0,
                    "lengthFrom": 20,
                    "lengthTo": 40
                }
            ]
        },
        {
            "databaseName": "db",
            "collectionName": "usergroups",
            "documentsCount": 20,
            "documentDescription": [
                {
                    "fieldName": "usergroupid",
                    "type": "autoIncrement",
                    "nullPercentage": 0,
                    "autoIncrementStart": 0,
                    "autoIncrementSteps": 1
                },   
                {
                    "fieldName": "groupid",
                    "type": "referenceTo",
                    "nullPercentage": 0,
                    "referenceTo": 1
                },    
                {
                    "fieldName": "userid",
                    "type": "referenceTo",
                    "nullPercentage": 0,
                    "referenceTo": 0
                }
            ]
        }
    ]

</details>

Output of the schema file when executed with following command:

    > node index.js schema="../samples/sql_references_temp_test.json" of=sql ot=cmd
    
    INSERT INTO db.users (userid, username) VALUES (0, 'Tessie Grady');
    INSERT INTO db.users (userid, username) VALUES (1, 'Heidi Wiegand');
    INSERT INTO db.users (userid, username) VALUES (2, 'Delores Hickle');
    INSERT INTO db.users (userid, username) VALUES (3, 'Maverick Romaguera');
    INSERT INTO db.users (userid, username) VALUES (4, 'Jerod Fadel');
    INSERT INTO db.users (userid, username) VALUES (5, 'Roxane Gutkowski');
    INSERT INTO db.users (userid, username) VALUES (6, 'Jocelyn Frami');
    INSERT INTO db.users (userid, username) VALUES (7, 'Clint Mills');
    INSERT INTO db.users (userid, username) VALUES (8, 'Courtney Kertzmann');
    INSERT INTO db.users (userid, username) VALUES (9, 'Jack Gerlach');
    INSERT INTO db.groups (groupid, groupname) VALUES (0, 'yVwQnfl0QvRfAn5psaT2SWZnSIFb5ELZ5Sf4zR4');
    INSERT INTO db.groups (groupid, groupname) VALUES (1, 't3CliflivodizMwNzo09aEEvbZTuvO');
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (0, 0, 5);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (1, 0, 6);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (2, 1, 3);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (3, 1, 9);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (4, 0, 5);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (5, 1, 4);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (6, 0, 8);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (7, 0, 3);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (8, 0, 8);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (9, 1, 5);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (10, 0, 3);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (11, 0, 2);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (12, 1, 4);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (13, 1, 6);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (14, 1, 4);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (15, 0, 5);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (16, 0, 1);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (17, 0, 5);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (18, 0, 3);
    INSERT INTO db.usergroups (usergroupid, groupid, userid) VALUES (19, 0, 5);

### A Test for injecting into static files (references in this case):

<details>
  <summary>View schema file</summary>

    [
        {
            "databaseName": "db",
            "collectionName": "users",
            "documentsCount": 2,
            "documentDescription": [        
                {
                    "fieldName": "_id",
                    "type": "objectId",
                    "nullPercentage": 0,
                    "referenceKey": 0
                },    
                {
                    "fieldName": "username",
                    "type": "faker",
                    "namespaceName": "name",
                    "methodName": "findName",
                    "nullPercentage": 0
                },    
                {
                    "fieldName": "language",
                    "type": "referenceTo",
                    "nullPercentage": 0,
                    "referenceTo": 1
                }
            ]
        },
        {
            "databaseName": "db",
            "collectionName": "languages",
            "documentsCount": 2,
            "documentDescription": [
                {
                    "fieldName": "_id",
                    "type": "objectId",
                    "nullPercentage": 0,
                    "referenceKey": 1
                }
            ],
            "isDocumentStatic": true,
            "injectIntoStatic": true,
            "staticDocuments": [
                {"code":"ab","name":"Abkhaz","nativeName":"аҧсуа"}, {"code":"aa","name":"Afar","nativeName":"Afaraf"}, {"code":"af","name":"Afrikaans","nativeName":"Afrikaans"}
            ]
        }
    ]

</details>

Output of the schema file when executed with following command:

    > node index.js schema="../samples/static_content_temp_test.json" of=mongodb ot=cmd
    
    db.users.insert({"_id": new ObjectId("5cfedb1544b4299ccd6e705b"), "username": "Jose Spinka", "language": new ObjectId("5cfedb1544b4299ccd6e705e")});
    db.users.insert({"_id": new ObjectId("5cfedb1544b4299ccd6e705c"), "username": "Herta Raynor", "language": new ObjectId("5cfedb1544b4299ccd6e705e")});
    db.languages.insert({"_id": new ObjectId("5cfedb1544b4299ccd6e705d"), "code": "ab", "name": "Abkhaz", "nativeName": "аҧсуа"});
    db.languages.insert({"_id": new ObjectId("5cfedb1544b4299ccd6e705e"), "code": "aa", "name": "Afar", "nativeName": "Afaraf"});
    db.languages.insert({"_id": new ObjectId("5cfedb1544b4299ccd6e705f"), "code": "af", "name": "Afrikaans", "nativeName": "Afrikaans"});

# Known problems
- Unfinished product. Check back later for finished product (Or feel free to contribute)
