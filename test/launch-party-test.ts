import { LaunchParty } from '../src/index';
import * as assert from 'assert';
import IORedis from 'ioredis';

describe('Launch Party', () => {

    const launchParty = new LaunchParty();
    const redisClient = new IORedis();

    before( async () => {
        await launchParty.isConnected();
    });

    beforeEach(() => {
        redisClient.flushall();
    });

    it('Should add a feature for an account', async () => {
        const response = await launchParty.launchFeatureForAnAccount('feature7001', 'account9001');
        const result = await redisClient.sismember(launchParty.getRedisAccountKey('account9001'),
            'feature7001');
        assert.equal(response, true);
        assert.equal(result, 1);
    });

/****************************************************** */
    it('Should add a feature for all accounts (test-with-feature-for-all)', async () => {
        await launchParty.launchFeatureForAnAccount('feature7002', 'account9002');
        const response = await launchParty.launchFeatureForAllAccounts('feature7002');
        const result = await redisClient.sismember(launchParty.getRedisAccountKey('account9002'),
            'feature7002');
        const result2 = await redisClient.sismember(launchParty.getFeatureForAllKey(), 'feature7002');
        assert.equal(response, true);
        assert.equal(result, 1);
        assert.equal(result2, 1);
    });

    it('Should add a feature for all accounts (feature-for-all)', async () => {
        const response = await launchParty.launchFeatureForAllAccounts('feature7003');
        const result = await redisClient.sismember(launchParty.getFeatureForAllKey(), 'feature7003');
        assert.equal(response, true);
        assert.equal(result, 1);
    });
/******************************************************* */
    it('Should check if a feature launched for an account', async () => {
        await launchParty.launchFeatureForAnAccount('feature7004', 'account9004');
        const response = await launchParty.isFeatureLaunchedInAnAccount('feature7004', 'account9004');
        const result = await redisClient.sismember(launchParty.getRedisAccountKey('account9004'),
            'feature7004');
        assert.equal(response, true);
        assert.equal(response, 1);
    });

    it('Should check if a feature launched for an account (account not present)', async () => {
        const response = await launchParty.isFeatureLaunchedInAnAccount('feature7004', 'account9004');
        const result = await redisClient.sismember(launchParty.getRedisAccountKey('account9004'),
            'feature7004');
        assert.equal(result, 0);
        assert.equal(response, false);
    });

    it('Should check if a feature launched for an account (feature-for-all)', async () => {
        await launchParty.launchFeatureForAllAccounts('feature70044');
        const response = await launchParty.isFeatureLaunchedInAnAccount('feature70044', 'account90044');
        const result = await redisClient.sismember(launchParty.getFeatureForAllKey(), 'feature70044');
        assert.equal(response, result);
        assert.equal(response, true);
    });
/******************************************************* */

    it('Should return accounts where feature is launched', async () => {
        await launchParty.launchFeatureForAnAccount('feature7005', 'account9005');
        await launchParty.launchFeatureForAnAccount('feature7005', 'account9006');
        const response = await launchParty.accountsWhereFeatureIsLaunched('feature7005');
        const result = ['account9005', 'account9006'];
        assert.deepEqual(response, result);
    });

    it('Should return accounts where feature is launched(feature-for-all)', async () => {
        await launchParty.launchFeatureForAllAccounts('feature7006');
        const response = await launchParty.accountsWhereFeatureIsLaunched('feature7006');
        const result = ['*'];
        assert.deepEqual(response, result);
    });
// /******************************************************* */

    it('Should return features launched for an account', async () => {
        await launchParty.launchFeatureForAnAccount('feature7007', 'account9007');
        await launchParty.launchFeatureForAnAccount('feature7008', 'account9007');
        await launchParty.launchFeatureForAllAccounts('feature7009');
        const response = await launchParty.featuresLaunchedForAnAccount('account9007');
        const result = ['feature7009', 'feature7008', 'feature7007'];
        assert.deepEqual(response, result);
    });
/******************************************************* */

    it('Should check feature launched in all accounts (feature-for-all)', async () => {
        await launchParty.launchFeatureForAllAccounts('feature7009');
        const response = await redisClient.sismember(launchParty.getFeatureForAllKey(), 'feature7009');
        assert.equal(response, 1);
    });

    it('Should check feature launched in all accounts', async () => {
        const response = await redisClient.sismember(launchParty.getFeatureForAllKey(), 'feature7010');
        assert.equal(response, 0);
    });
/******************************************************* */

it('Should return the features launched for all accounts', async () => {
    await launchParty.launchFeatureForAllAccounts('feature7014');
    await launchParty.launchFeatureForAllAccounts('feature7015');
    const response = await redisClient.smembers(launchParty.getFeatureForAllKey());
    const result = ['feature7015', 'feature7014'];
    assert.deepEqual(response, result);
});

/******************************************************* */

    it('Should revoke a feature for an account', async () => {
        await launchParty.launchFeatureForAnAccount('feature7011', 'account9008');
        const response = await launchParty.revokeFeatureFromAnAccount('feature7011', 'account9008');
        const result = await redisClient.sismember(launchParty.getRedisAccountKey('account9008'),
            'feature7011');
        assert.equal(response, true);
        assert.equal(result, false);
    });
/******************************************************* */

    it('Should revoke a feature for all accounts (feature-for-all)', async () => {
        await launchParty.launchFeatureForAnAccount('feature7012', 'account9009');
        await launchParty.launchFeatureForAllAccounts('feature7012');
        const response = await launchParty.revokeFeatureFromAllAccounts( 'feature7012', false);
        const result = await redisClient.sismember(launchParty.getFeatureForAllKey(), 'feature7004');
        const result2 = await redisClient.sismember(launchParty.getRedisAccountKey('account9009'),
            'feature7012');
        assert.equal(response, true);
        assert.equal(result, false);
        assert.equal(result2, true);
    });

    it('Should revoke a feature for all accounts (test_with_feature-for-all)', async () => {
        await launchParty.launchFeatureForAnAccount('feature7013', 'account9010');
        await launchParty.launchFeatureForAllAccounts('feature7013');
        const response = await launchParty.revokeFeatureFromAllAccounts( 'feature7013', true);
        const result = await redisClient.sismember(launchParty.getFeatureForAllKey(), 'feature7013');
        const result2 = await redisClient.sismember(launchParty.getRedisAccountKey('account9010'),
            'feature7013');
        assert.equal(response, true);
        assert.equal(result, false);
        assert.equal(result2, false);
    });

});
