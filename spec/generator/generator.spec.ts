import { Generator } from "../../src/generator/generator";

describe("NodeTestdataGenerator", () => {
    it("should be truthy", () => {
        expect(Generator).toBeTruthy();
    });
});

describe("NodeTestdataGenerator - randomNumbers: ", () => {
    it("should be truthy", () => {
        expect(Generator).toBeTruthy();
    });

    it("nextRandomNumberBetween should return number between 0 and 3", () => {
        //@ts-ignore
        let result: number = Generator['nextRandomNumberBetween'](0, 3);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(3);
    });

    it("nextRandomNumberBetween should return 1", () => {
        //@ts-ignore
        let result: number = Generator['nextRandomNumberBetween'](1, 1);
        expect(result).toBe(1);
    });

    it("nextRandomNumberBetween should return -1", () => {
        //@ts-ignore
        let result: number = Generator['nextRandomNumberBetween'](-1, -1);
        expect(result).toBe(-1);
    });

    it("nextRandomNumber should return 0 or 1", () => {
        //@ts-ignore
        let result: number = Generator['nextRandomNumber'](1);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1);
    });

    it("nextRandomNumber should return 0", () => {
        //@ts-ignore
        let result: number = Generator['nextRandomNumber'](0);
        expect(result).toBe(0);
    });

    it("nextRandomNumber should return -1", () => {
        //@ts-ignore
        let result: number = Generator['nextRandomNumber'](-1);
        expect(result).toBe(-1);
    });

    it("nextRandomDecimalBetween should return decimal between 0.0 and 1.0", () => {
        //@ts-ignore
        let result: number = Generator['nextRandomDecimalBetween'](0.0, 1.0);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
    });

    it("nextRandomDecimalBetween should return decimal between -1.0 and 1.0", () => {
        //@ts-ignore
        let result: number = Generator['nextRandomDecimalBetween'](-1.0, 1.0);
        expect(result).toBeGreaterThanOrEqual(-1);
        expect(result).toBeLessThanOrEqual(1);
    });
});

describe("NodeTestdataGenerator - repeat: ", () => {

    it("should repeat the field", () => {
        //@ts-ignore
        let result = Generator['repeat'](
            Generator.generateFields,
            [],
            2
        );

        expect(result.length).toBe(2);
    });
});