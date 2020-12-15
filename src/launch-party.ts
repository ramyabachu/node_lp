import * as fs from 'fs';
import * as path from 'path';
import IORedis from 'ioredis';

const debug = require('debug')('launch-party');
const scriptPath: string = path.resolve(__dirname, '..', 'script');
const launchFeatureForOneAccountScript = fs.readFileSync(scriptPath + '/launch-feature-for-one-account.lua');
const revokeFeatureFromOneAccountScript = fs.readFileSync(scriptPath + '/revoke-feature-from-one-account.lua');
const isFeatureLaunchedInOneAccountScript = fs.readFileSync(scriptPath + '/is-feature-launched-in-one-account.lua');
const revokeFeatureFromAllAccountsScript = fs.readFileSync(scriptPath + '/revoke-feature-from-all-accounts.lua');
const accountsWhereFeatureIsLaunchedScript = fs.readFileSync(scriptPath + '/accounts-where-feature-is-launched.lua');
const defaultAccountKey: string = 'LP:Account:';
const defaultFeatureKey: string = 'LP:Feature:';
const defaultHost: string = 'localhost';
const defaultFeatureForAll: string = 'feature_for_all';

interface ModuleInterface {
    port?: number;              //Port of the Redis server.
    host?: string;              //Host of the Redis server.
    clientPassword?: string;    //If set, client will send AUTH command with the value of this option when connected.
    accountKey: string;         //This is a common prefix for all accounts eg. 'LP:Account:'
    featureKey: string;         //This a common prefix for all features eg. 'LP:Feature:'
 }
const defaultKeys: ModuleInterface = {
    port : 6379,
    host : defaultHost,
    clientPassword : "",
    accountKey : defaultAccountKey,
    featureKey : defaultFeatureKey,
};

export class LaunchParty {

    private redisClient: any;
    private featureForAll: string;
    private redisFeatureKey: string;
    private redisAccountKey: string;
    private redisKeys: ModuleInterface;
    constructor(clientKeys: ModuleInterface = defaultKeys) {
        this.redisKeys = {...defaultKeys, ...clientKeys};
        this.redisClient = new IORedis(this.redisKeys.port, this.redisKeys.host,
            { password: this.redisKeys.clientPassword });
        this.redisClient.on('connect', () => {
           debug('Connection has been established with Redis...');
           debug('Message from module');
        });

        this.redisClient.on('error', (error: any) => {
           debug('Error in establishing connection with Redis: ' + error);
            throw new Error('Error in establishing connection with Redis: ' + error);
        });
        this.redisAccountKey = this.redisKeys.accountKey;
        this.redisFeatureKey = this.redisKeys.featureKey;
        this.featureForAll = defaultFeatureForAll;
    }

    async isConnected() {
        this.redisClient.connect( ()=> {
        debug('Connected to Redis and ready to use');
        });
    }

    async launchFeatureForAnAccount(feature: string, account: string): Promise<boolean> {
            await this.redisClient.eval(launchFeatureForOneAccountScript, 2,
                this.getRedisAccountKey(account), this.getRedisFeatureKey(feature), account, feature);
            return true;
    }

    async revokeFeatureFromAnAccount(feature: string, account: string): Promise<boolean> {
            await this.redisClient.eval(revokeFeatureFromOneAccountScript, 2,
                this.getRedisAccountKey(account), this.getRedisFeatureKey(feature), account, feature);
            return true;
    }

    async isFeatureLaunchedInAnAccount(feature: string, account: string): Promise<boolean> {
            const result: number = await this.redisClient.eval(isFeatureLaunchedInOneAccountScript, 2,
                this.featureForAll, this.getRedisAccountKey(account), feature);
            if (result === 1) {
                return true;
            } else {
                return false;
            }
    }

    async launchFeatureForAllAccounts(feature: string): Promise<boolean> {
            await this.redisClient.sadd(this.featureForAll, feature);
            return true;
    }

    async revokeFeatureFromAllAccounts(feature: string,
                                       cleanupIndividualAccounts: boolean = false): Promise<boolean> {
                    /*****
                    * cleanupIndividualAccounts is a boolean which specifies whether to revoke the feature from the accounts
                    * for which the feature was launched individually before or after launching it for all the accounts.
                    */
            if (cleanupIndividualAccounts === true) {
                await this.redisClient.eval(revokeFeatureFromAllAccountsScript, 2,
                    this.featureForAll, this.getRedisFeatureKey(feature), feature, this.redisAccountKey);
            } else {
                await this.redisClient.srem(this.featureForAll, feature);
            }
            return true;
    }

    async accountsWhereFeatureIsLaunched(feature: string): Promise<string[]> {
            const results: any = await this.redisClient.eval(accountsWhereFeatureIsLaunchedScript, 2,
                this.featureForAll, this.getRedisFeatureKey(feature), feature);
            if (results === 1) {
                return ['*'];
            } else {
                return results;
            }
    }

    async featuresLaunchedForAnAccount(account: string): Promise<string[]> {
            const results: string[] = await this.redisClient.sunion(this.getRedisAccountKey(account),
                this.featureForAll);
            return results;
    }

    async isFeatureLaunchedInAllAccounts(feature: string): Promise<boolean> {
            const result: number = await this.redisClient.sismember(this.featureForAll, feature);
            if (result === 1) {
                return true;
            } else {
                return false;
            }
    }

    async featuresLaunchedInAllAccounts(): Promise<string[]> {
        const result: string[] = await this.redisClient.smembers(this.featureForAll);
        return result;
    }

    getRedisAccountKey(account: string = ""): string {
        return this.redisAccountKey + account;
    }

    getRedisFeatureKey(feature: string= ""): string {
        return this.redisFeatureKey + feature;
    }

    getFeatureForAllKey(): string {
        return this.featureForAll;
    }

}