/**
 * AWS Profile
 *
 * Holding a single AWS profile
 *
 */
export default class AwsProfile {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
}
