import LinkClickHandler from "../../../src/core/linkClickHandler";
import Config from "../../../src/config/config";
import { Plugin } from "obsidian";

describe("LinkClickHandler", () => {
    let linkClickHandler: LinkClickHandler;
    let mockPlugin: MockPlugin;
    let mockCallback: jest.Mock;
    let mockContainer: HTMLElement;

    interface MockPlugin {
        app: {
            workspace: {
                containerEl: HTMLElement;
            };
        };
        registerDomEvent: jest.Mock;
    }

    beforeEach(() => {
        mockContainer = document.createElement("div");
        mockCallback = jest.fn();
        
        mockPlugin = {
            app: {
                workspace: {
                    containerEl: mockContainer
                }
            },
            registerDomEvent: jest.fn()
        } as unknown as MockPlugin;

        linkClickHandler = new LinkClickHandler(mockPlugin as unknown as Plugin, mockCallback);
    });

    describe("parseS3Link", () => {
        it("should parse regular S3 file links", () => {
            const handler = new LinkClickHandler(mockPlugin as unknown as Plugin, mockCallback);
            const result = (handler as unknown as { parseS3Link: (href: string) => { prefix: string | null; objectKey: string | null } }).parseS3Link("s3:path/to/file.pdf");
            
            expect(result).toEqual({
                prefix: Config.S3_FILE_LINK_PREFIX,
                objectKey: "path/to/file.pdf"
            });
        });

        it("should parse S3 signed links", () => {
            const handler = new LinkClickHandler(mockPlugin as unknown as Plugin, mockCallback);
            const result = (handler as unknown as { parseS3Link: (href: string) => { prefix: string | null; objectKey: string | null } }).parseS3Link("s3-sign:path/to/file.pdf");
            
            expect(result).toEqual({
                prefix: Config.S3_SIGNED_LINK_PREFIX,
                objectKey: "path/to/file.pdf"
            });
        });


        it("should handle object keys with colons", () => {
            const handler = new LinkClickHandler(mockPlugin as unknown as Plugin, mockCallback);
            const result = (handler as unknown as { parseS3Link: (href: string) => { prefix: string | null; objectKey: string | null } }).parseS3Link("s3:folder/file:with:colons.pdf");
            
            expect(result).toEqual({
                prefix: Config.S3_FILE_LINK_PREFIX,
                objectKey: "folder/file:with:colons.pdf"
            });
        });

        it("should return null for non-S3 links", () => {
            const handler = new LinkClickHandler(mockPlugin as unknown as Plugin, mockCallback);
            
            const parseS3Link = (handler as unknown as { parseS3Link: (href: string) => { prefix: string | null; objectKey: string | null } }).parseS3Link;
            
            expect(parseS3Link("https://example.com")).toEqual({
                prefix: null,
                objectKey: null
            });
            
            expect(parseS3Link("file:///path/to/file")).toEqual({
                prefix: null,
                objectKey: null
            });
        });

        it("should handle empty hrefs", () => {
            const handler = new LinkClickHandler(mockPlugin as unknown as Plugin, mockCallback);
            
            const parseS3Link = (handler as unknown as { parseS3Link: (href: string | null) => { prefix: string | null; objectKey: string | null } }).parseS3Link;
            
            expect(parseS3Link("")).toEqual({
                prefix: null,
                objectKey: null
            });
            
            expect(parseS3Link(null)).toEqual({
                prefix: null,
                objectKey: null
            });
        });
    });

    describe("click handling", () => {
        it("should intercept S3 link clicks", () => {
            linkClickHandler.register();
            
            const anchor = document.createElement("a");
            anchor.href = "s3:test/file.pdf";
            mockContainer.appendChild(anchor);

            const event = new MouseEvent("click", {
                bubbles: true,
                cancelable: true
            });
            
            const preventDefault = jest.spyOn(event, "preventDefault");
            const stopPropagation = jest.spyOn(event, "stopPropagation");

            // Simulate the click handler being called
            const registeredHandler = mockPlugin.registerDomEvent.mock.calls[0][2];
            Object.defineProperty(event, "target", { value: anchor, writable: false });
            registeredHandler(event);

            expect(preventDefault).toHaveBeenCalled();
            expect(stopPropagation).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith("test/file.pdf", false);
        });

        it("should not intercept non-S3 links", () => {
            linkClickHandler.register();
            
            const anchor = document.createElement("a");
            anchor.href = "https://example.com";
            mockContainer.appendChild(anchor);

            const event = new MouseEvent("click", {
                bubbles: true,
                cancelable: true
            });
            
            const preventDefault = jest.spyOn(event, "preventDefault");

            // Simulate the click handler being called
            const registeredHandler = mockPlugin.registerDomEvent.mock.calls[0][2];
            Object.defineProperty(event, "target", { value: anchor, writable: false });
            registeredHandler(event);

            expect(preventDefault).not.toHaveBeenCalled();
            expect(mockCallback).not.toHaveBeenCalled();
        });
    });
});