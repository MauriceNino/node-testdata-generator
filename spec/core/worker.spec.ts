import { NodeTestdataGenerator } from "../../src/core/worker";
import { CmdOpts } from "../../src/models/modelInput";
import { DataHandle } from "../../src/core/dataHandle";
import { AssertionError } from "assert";

describe("NodeTestdataGenerator", () => {
    it("should be truthy", () => {
        expect(NodeTestdataGenerator).toBeTruthy();
    });

    it("should create 3 inserts", (done) => {
        
        var opts: CmdOpts = new CmdOpts();
        opts.schemaFile = "samples/alltypes_temp_test.json";
        opts.outputFormat= "mongodb";

        let countDb: number = 0;
        NodeTestdataGenerator.doWork(opts).then(async (dataHandle: DataHandle) => {
            while(await dataHandle.hasNext()) {
                await dataHandle.getNext();
                countDb++;
            }

            await NodeTestdataGenerator.destroyInMemoryDatabase();

            expect(countDb).toBe(3);

            done();
        });

    });
});
