interface ModuleInterface {
    port?: number;
    host?: string;
    clientPassword?: string;
    accountKey: string;
    featureKey: string;
}
export declare class LaunchParty {
    private redisClient;
    private featureForAll;
    private redisFeatureKey;
    private redisAccountKey;
    private redisKeys;
    constructor(clientKeys?: ModuleInterface);
    isConnected(): Promise<void>;
    launchFeatureForAnAccount(feature: string, account: string): Promise<boolean>;
    revokeFeatureFromAnAccount(feature: string, account: string): Promise<boolean>;
    isFeatureLaunchedInAnAccount(feature: string, account: string): Promise<boolean>;
    launchFeatureForAllAccounts(feature: string): Promise<boolean>;
    revokeFeatureFromAllAccounts(feature: string, cleanupIndividualAccounts?: boolean): Promise<boolean>;
    accountsWhereFeatureIsLaunched(feature: string): Promise<string[]>;
    featuresLaunchedForAnAccount(account: string): Promise<string[]>;
    isFeatureLaunchedInAllAccounts(feature: string): Promise<boolean>;
    featuresLaunchedInAllAccounts(): Promise<string[]>;
    getRedisAccountKey(account?: string): string;
    getRedisFeatureKey(feature?: string): string;
    getFeatureForAllKey(): string;
}
export {};
