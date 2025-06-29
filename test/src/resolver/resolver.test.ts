import Resolver, { TargetElement } from "../../../src/resolvers/resolver";

class TestResolver extends Resolver {
    protected override readonly moduleName = "TestModule";
    protected readonly targetElement: TargetElement = "span.internal-embed";

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public resolveHtmlElement(element: HTMLElement) {
        return {
            objectKeys: this.objectKeys,
            signObjectKeys: this.signObjectKeys,
        };
    }
}

describe("Resolver", () => {
    let resolver: TestResolver;

    beforeEach(() => {
        resolver = new TestResolver();
    });

    it("should add an object key", () => {
        const element = document.createElement("div");
        resolver["addFileObjectKey"]("testKey", element);

        expect(resolver["objectKeys"].has("testKey")).toBe(true);
        expect(resolver["objectKeys"].get("testKey")).toContain(element);
    });

    it("should add a signed object key", () => {
        const element = document.createElement("div");
        resolver["addSignObjectKey"]("testSignedKey", element);

        expect(resolver["signObjectKeys"].has("testSignedKey")).toBe(true);
        expect(resolver["signObjectKeys"].get("testSignedKey")).toContain(
            element
        );
    });

    it("should clear object keys", () => {
        const element = document.createElement("div");
        resolver["addFileObjectKey"]("testKey", element);
        resolver["clearObjectKeys"]();

        expect(resolver["objectKeys"].size).toBe(0);
    });

    it("should clear signed object keys", () => {
        const element = document.createElement("div");
        resolver["addSignObjectKey"]("testSignedKey", element);
        resolver["clearSignObjectKeys"]();

        expect(resolver["signObjectKeys"].size).toBe(0);
    });

    it("should process valid object keys correctly", () => {
        const element = document.createElement("div");
        const consoleDebugSpy = jest
            .spyOn(console, "debug")
            .mockImplementation();

        resolver["processValidObjectKey"]("validKey", element, false);

        expect(resolver["objectKeys"].has("validKey")).toBe(true);
        expect(consoleDebugSpy).toHaveBeenCalledWith(
            "TestModule::processValidObjectKey - Valid regular objectKey found:",
            "validKey"
        );

        consoleDebugSpy.mockRestore();
    });

    it("should ignore invalid object keys", () => {
        const element = document.createElement("div");
        const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

        resolver["processValidObjectKey"]("invalidKey/", element, false);

        expect(resolver["objectKeys"].size).toBe(0);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            "TestModule::processValidObjectKey - Invalid objectKey(ignoring):",
            "invalidKey/"
        );

        consoleWarnSpy.mockRestore();
    });

    it("should validate object keys correctly", () => {
        expect(resolver["isValidObjectKey"]("validKey")).toBe(true);
        expect(resolver["isValidObjectKey"]("invalidKey/")).toBe(false);
        expect(resolver["isValidObjectKey"]("")).toBe(false);
    });
});
