"use strict";

const { ServiceBroker } = require("moleculer");
const { ValidationError } = require("moleculer").Errors;
const TestService = require("../../../services/auth.service");

describe('Users Service', () => {
    let broker;

    before(async () => {
        broker = new ServiceBroker();
        await broker.createService(UsersService);
        await broker.start();
    });

    after(async () => {
        await broker.stop();
    });

    describe('sendmail action', () => {
        it('should send mail with correct code', async () => {
            // Mocking pool.query and redis.get
            sinon.stub(pool, 'query').resolves({ rows: [{ user_id: 1 }] });
            sinon.stub(redis, 'get').resolves('123456');

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            await broker.call('users.sendmail', { login: 'test@example.com', code: '123456' }, res);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith({ message: "Правильный код", token: null })).to.be.true;

            // Restore stubs
            pool.query.restore();
            redis.get.restore();
        });

        // Add more test cases for different scenarios
    });

    describe('login action', () => {
        it('should login with correct credentials', async () => {
            // Mocking pool.query
            sinon.stub(pool, 'query').resolves({ rows: [{ user_id: 1, surname: 'TestSurname' }] });

            const res = {
                json: sinon.stub()
            };

            const ctx = {
                call: sinon.stub().resolves('BearerToken')
            };

            await broker.call('users.login', 'test@example.com', 'password123', res, ctx);

            expect(res.json.calledWith({ message: 'Вы успешно вошли под именем: TestSurname', token: 'BearerToken' })).to.be.true;

            // Restore stub
            pool.query.restore();
        });
    });

	describe('register action', () => {
        it('should register a new user', async () => {
            // Mocking pool.query
            sinon.stub(pool, 'query').resolves({ rowCount: 0 }); // No existing user

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            await broker.call('users.register', 'TestSurname', 'TestName', 'TestPatronymic', 'test@example.com', true, '123456789', true, 'password123', true);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith({ message: 'Успешно добавлен пользователь', token: null })).to.be.true;

            // Restore stub
            pool.query.restore();
        });
	});
	
});

