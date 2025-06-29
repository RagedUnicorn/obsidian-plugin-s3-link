import * as fs from "fs";
import * as os from "os";

import AwsCredentialProvider from "../../../src/aws/awsCredentialProvider";
import Config from "../../../src/config/config";

jest.mock("os");

const mockOs = os as jest.Mocked<typeof os>;

describe("AwsCredentialProvider", () => {
    let provider: AwsCredentialProvider;
    const fakePath = "\\fake\\home\\.aws\\credentials";
    const sampleIni = `
        [profile1]
        aws_access_key_id = ACCESSKEY1
        aws_secret_access_key = SECRET1

        [profile2]
        aws_access_key_id = ACCESSKEY2
        aws_secret_access_key = SECRET2
    `;

    beforeEach(() => {
        provider = new AwsCredentialProvider();

        mockOs.homedir.mockReturnValue("\\fake\\home");

        jest.spyOn(fs.promises, "access").mockResolvedValue(undefined as any);
        jest.spyOn(fs.promises, "readFile").mockResolvedValue(sampleIni);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("getAwsProfiles returns list of profiles", async () => {
        const profiles = await provider.getAwsProfiles();
        console.log(profiles);
        expect(fs.promises.access).toHaveBeenCalledWith(
            fakePath,
            fs.constants.F_OK
        );
        expect(fs.promises.readFile).toHaveBeenCalledWith(fakePath);
        expect(profiles).toHaveLength(3);
        expect(profiles[0].name).toBe(Config.AWS_PROFILE_NAME_NONE);
        expect(profiles[1].name).toBe("profile1");
        expect(profiles[2].name).toBe("profile2");
    });
});
