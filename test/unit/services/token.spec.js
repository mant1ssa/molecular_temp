const { expect } = require('chai');
const sinon = require('sinon');
const { ServiceBroker } = require('moleculer');
const jwt = require('jsonwebtoken');
const { pool } = require("../mixins/db.mixin");

const TokenService = require('../../../services/token.service')

describe('Token Service', () => {
    let broker;

    before(async () => {
        broker = new ServiceBroker();
        await broker.createService(TokenService);
        await broker.start();
    });

    after(async () => {
        await broker.stop();
    });

    describe('saveToken action', () => {
        it('should save token for user', async () => {
            // Mocking pool.query
            sinon.stub(pool, 'query').resolves();

            await broker.call('token.saveToken', 1, 'testToken');

            // Expect pool.query to be called with correct parameters
            expect(pool.query.calledWith("UPDATE users SET token = $1 WHERE user_id = $2", ['testToken', 1])).to.be.true;

            // Restore stub
            pool.query.restore();
        });

        // Add more test cases for different scenarios
    });

    describe('createandbind action', () => {
        it('should create and bind tokens', async () => {
            // Mocking ctx.call and jwt.sign
            const ctx = {
                call: sinon.stub().resolves(),
            };

            sinon.stub(jwt, 'sign').returns('testAccessToken');

            const result = await broker.call('token.createandbind', 1, ctx);

            expect(result).to.deep.equal({
                accessToken: 'testAccessToken',
                refreshToken: 'testRefreshToken'
            });

            // Expect jwt.sign to be called with correct parameters
            expect(jwt.sign.calledWith({ userId: 1 }, process.env.ACCESS_TOKENS_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES })).to.be.true;

            // Restore stubs
            jwt.sign.restore();
        });

        // Add more test cases for different scenarios
    });

    describe('getTokenData action', () => {
        it('should get token data', async () => {
            // Mocking jwt.verify
            sinon.stub(jwt, 'verify').returns({ userId: 1 });

            const result = await broker.call('token.getTokenData', 'testBearerToken');

            expect(result).to.deep.equal({ userId: 1 });

            // Expect jwt.verify to be called with correct parameters
            expect(jwt.verify.calledWith('testBearerToken', process.env.ACCESS_TOKENS_SECRET)).to.be.true;

            // Restore stub
            jwt.verify.restore();
        });

        // Add more test cases for different scenarios
    });

    describe('generateToken action', () => {
        it('should generate token', async () => {
            // Mocking jwt.sign
            sinon.stub(jwt, 'sign').returns('testToken');

            const result = await broker.call('token.generateToken', { userId: 1 });

            expect(result).to.equal('testToken');

            // Expect jwt.sign to be called with correct parameters
            expect(jwt.sign.calledWith({ userId: 1 }, process.env.ACCESS_TOKENS_SECRET, { expiresIn: '1d' })).to.be.true;

            // Restore stub
            jwt.sign.restore();
        });

        // Add more test cases for different scenarios
    });

    // Add tests for other actions
});
