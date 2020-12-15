"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ioredis_1 = __importDefault(require("ioredis"));
const debug = require('debug')('launch-party');
const scriptPath = path.resolve(__dirname, '..', 'script');
const launchFeatureForOneAccountScript = fs.readFileSync(scriptPath + '/launch-feature-for-one-account.lua');
const revokeFeatureFromOneAccountScript = fs.readFileSync(scriptPath + '/revoke-feature-from-one-account.lua');
const isFeatureLaunchedInOneAccountScript = fs.readFileSync(scriptPath + '/is-feature-launched-in-one-account.lua');
const revokeFeatureFromAllAccountsScript = fs.readFileSync(scriptPath + '/revoke-feature-from-all-accounts.lua');
const accountsWhereFeatureIsLaunchedScript = fs.readFileSync(scriptPath + '/accounts-where-feature-is-launched.lua');
const defaultAccountKey = 'LP:Account:';
const defaultFeatureKey = 'LP:Feature:';
const defaultHost = 'localhost';
const defaultFeatureForAll = 'feature_for_all';
const defaultKeys = {
    port: 6379,
    host: defaultHost,
    clientPassword: "",
    accountKey: defaultAccountKey,
    featureKey: defaultFeatureKey,
};
class LaunchParty {
    constructor(clientKeys = defaultKeys) {
        this.redisKeys = Object.assign({}, defaultKeys, clientKeys);
        this.redisClient = new ioredis_1.default(this.redisKeys.port, this.redisKeys.host, { password: this.redisKeys.clientPassword });
        this.redisClient.on('connect', () => {
            debug('Connection has been established with Redis...');
            debug('Message from module');
        });
        this.redisClient.on('error', (error) => {
            debug('Error in establishing connection with Redis: ' + error);
            throw new Error('Error in establishing connection with Redis: ' + error);
        });
        this.redisAccountKey = this.redisKeys.accountKey;
        this.redisFeatureKey = this.redisKeys.featureKey;
        this.featureForAll = defaultFeatureForAll;
    }
    async isConnected() {
        this.redisClient.connect(() => {
            debug('Connected to Redis and ready to use');
        });
    }
    async launchFeatureForAnAccount(feature, account) {
        await this.redisClient.eval(launchFeatureForOneAccountScript, 2, this.getRedisAccountKey(account), this.getRedisFeatureKey(feature), account, feature);
        return true;
    }
    async revokeFeatureFromAnAccount(feature, account) {
        await this.redisClient.eval(revokeFeatureFromOneAccountScript, 2, this.getRedisAccountKey(account), this.getRedisFeatureKey(feature), account, feature);
        return true;
    }
    async isFeatureLaunchedInAnAccount(feature, account) {
        const result = await this.redisClient.eval(isFeatureLaunchedInOneAccountScript, 2, this.featureForAll, this.getRedisAccountKey(account), feature);
        if (result === 1) {
            return true;
        }
        else {
            return false;
        }
    }
    async launchFeatureForAllAccounts(feature) {
        await this.redisClient.sadd(this.featureForAll, feature);
        return true;
    }
    async revokeFeatureFromAllAccounts(feature, cleanupIndividualAccounts = false) {
        /*****
        * cleanupIndividualAccounts is a boolean which specifies whether to revoke the feature from the accounts
        * for which the feature was launched individually before or after launching it for all the accounts.
        */
        if (cleanupIndividualAccounts === true) {
            await this.redisClient.eval(revokeFeatureFromAllAccountsScript, 2, this.featureForAll, this.getRedisFeatureKey(feature), feature, this.redisAccountKey);
        }
        else {
            await this.redisClient.srem(this.featureForAll, feature);
        }
        return true;
    }
    async accountsWhereFeatureIsLaunched(feature) {
        const results = await this.redisClient.eval(accountsWhereFeatureIsLaunchedScript, 2, this.featureForAll, this.getRedisFeatureKey(feature), feature);
        if (results === 1) {
            return ['*'];
        }
        else {
            return results;
        }
    }
    async featuresLaunchedForAnAccount(account) {
        const results = await this.redisClient.sunion(this.getRedisAccountKey(account), this.featureForAll);
        return results;
    }
    async isFeatureLaunchedInAllAccounts(feature) {
        const result = await this.redisClient.sismember(this.featureForAll, feature);
        if (result === 1) {
            return true;
        }
        else {
            return false;
        }
    }
    async featuresLaunchedInAllAccounts() {
        const result = await this.redisClient.smembers(this.featureForAll);
        return result;
    }
    getRedisAccountKey(account = "") {
        return this.redisAccountKey + account;
    }
    getRedisFeatureKey(feature = "") {
        return this.redisFeatureKey + feature;
    }
    getFeatureForAllKey() {
        return this.featureForAll;
    }
}
exports.LaunchParty = LaunchParty;
