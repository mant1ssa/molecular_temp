const { connectDb } = require('../../../mixins/db.mixin');

// Mocking pool.query
jest.mock('pg', () => ({
    Pool: jest.fn(() => ({
        connect: jest.fn(() => Promise.resolve()),
        query: jest.fn(() => Promise.resolve({ rows: [{ surname: 'TestSurname' }] })),
        end: jest.fn(),
    })),
}));

describe('connectDb function', () => {
    it('should connect to the database and return pool', async () => {
        // Call the function
        const result = await connectDb();

        // Expect pool.query to be called with correct parameters
        expect(result.query).toHaveBeenCalledWith('SELECT * FROM users u WHERE u.user_id = 1');

        // Expect the console.log message
        expect(console.log).toHaveBeenCalledWith('Подключение к базе установлено успешно. Тестовый результат: ', 'TestSurname');

        // Ensure that the pool is returned
        expect(result).toBeDefined();
    });

    // Add more test cases for error handling, etc.
});
