const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config(); 

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

const connectDb = async () => {
    try {
        await pool.connect()
        const res = await pool.query('SELECT * FROM users u WHERE u.user_id = 1')
        console.log("Подключение к базе установлено успешно. Тестовый результат: ", res.rows[0].surname)
        // await pool.end()
    } catch (error) {
        console.log(error)
    }

    return pool
}