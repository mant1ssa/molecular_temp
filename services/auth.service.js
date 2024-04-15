
const { pool } = require("../mixins/db.mixin");
const bcrypt = require("bcrypt");
const redis = require('../redis/index.js')
const verificationModule = require("../verification");
const ApiErrors = require("./response.service.js");
const { Context } = require("moleculer");
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
    name: "users",
    settings: {

    },

    actions: {
    /**
     * Отправка кода из СМС/Почты
     * @param {object}  - данные запроса, тело и строка
     */
    sendmail: {
        rest: {
            path: "/sendmail"
        },
        params: {
            email: "string"
        },
        async handler(body, res){

            let userId;
            const { login, code } = body;

            try {
                userId = await pool.query('SELECT user_id FROM users WHERE email_address = $1', [login]);
            } catch (e) {
                console.log(e)
            }

            // Приставки к ключам
            let redisPasswordRecoverKey = "yurta:recover_password:";
            let userVerifyCodeKey = "Yurta:user:";

            userVerifyCodeKey = userVerifyCodeKey + userId.rows[0].user_id;
            const userVerifyCode = await redis.get(userVerifyCodeKey);

            redisPasswordRecoverKey = redisPasswordRecoverKey + userId.rows[0].user_id;
            const redisPasswordRecoverCode = await redis.get(redisPasswordRecoverKey);


            if(userVerifyCode){
                if(code == userVerifyCode){
                    login.includes('@') ? await pool.query("UPDATE users SET is_email_address_verified = true WHERE email_address = $1", [login]) : await pool.query("UPDATE users SET is_phone_verified = true WHERE phone_number = $1", [login])
                    const response = {
                        message: "Правильный код",
                        token: null
                    }
                    res.status(200).json(response);
                }else{
                    res.status(500).json("wrong code")
                }
            }
            if(redisPasswordRecoverCode){
                if(code == redisPasswordRecoverCode){
                    const response = {
                        message: "Правильный код",
                        token: null
                    };
                    res.status(200).json(response);
                }else{
                    res.status(500).json("wrong code")
                }
            }
        }
    },
        /**
         * Метод для входа по логину
         * @param {object} res
         * @param {string} email
         * @param {string} password
         * 
         * @return {object} result
         */ 
        login: {
            rest: {
				method: "POST",
				path: "/login"
			},
            params: {
				email: "string",
                password: "string"
			},
            async handler(email, password, res, ctx) {
                let isUserVerified;

                try{
                    // connectDb();
                    isUserVerified = pool.query('SELECT * FROM users u \
                        WHERE u.email_address = $1 AND u.password = $2', [email, password])

                }catch(e){
                    console.log(e)

                    throw ApiErrors.userNotFound;
                }

                const bearer = await ctx.call("token.createbind", isUserVerified.rows[0].user_id);
                const result = {
                    message: `Вы успешно вошли под именем: ${isUserVerified.rows[0].surname}`,
                    token: bearer
                }

                res.json(result)
            }
        },

        /**
         * Метод для выхода из аккаунта
         * @param {object} req - данные запроса, тело и строка
         * @param {object} res - ответ
         * @returns {object}
         */
        logout: {
            rest: {
                method: "GET",
                path: "/logout"
            },
            params: {

            },
            async handler(req, res, ctx){
                console.log(req.query);
                const { Authorization } = req.query
                const tokenData = await ctx.call("token.getData", Authorization);
                await pool.query("UPDATE users SET token = \"\" WHERE user_id = $2", [tokenData,userId]);
                res.status(200).json(tokenData);
            }
        },

        /**
         * Метод для регистрации нового аккаунта
         * 
         * @param {string} surname
         * @param {string} name
         * @param {string} patronymic
         * @param {string} email_address
         * @param {boolean} is_email_address_verified
         * @param {string} phone_number
         * @param {boolean} is_phone_number_verified
         * @param {string} password
         * 
         * @param {object} res
         */
        register: {
            rest: {
				method: "POST",
				path: "/register"
			},
            params: {
                surname: "string", 
                name: "string", 
                patronymic: "string", 
                email_address: "string", 
                is_email_address_verified: "boolean",
                phone_number: "string", 
                is_phone_number_verified: "boolean",
                password: "string",
                
			},
            async handler(surname, name, patronymic, email_address, phone_number, password, res) {
                password = await bcrypt.hash(password, 10);
                let userId;
                let isactive = true;

                try{
                    pool.query("BEGIN");
                    userId = pool.query('SELECT * FROM users u WHERE u.phone_number = $1 OR u.email_address = $2', [phone_number, email_address]);
                    if(userId.rowCount > 0){
                        throw new Error("Такой юзер уже есть")
                    }
                    userId =  pool.query('INSERT INTO users (surname, name, patronymic, email_address, is_email_address_verified, phone_number, is_phone_number_verified, password, isactive) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)  RETURNING user_id', [surname, name, patronymic, email_address, is_email_address_verified, phone_number, is_phone_number_verified, password, isactive]);
                    pool.query("COMMIT");

                }catch(e){
                    console.log(e)
                    pool.query("ROLLBACK");
                    const error = {
                        message: "Возникла ошибка регистрации, подробнее: " + e,
                        token: null
                    }
                    res.status(500).json(error)
                }

                const result = {
                    message: "Успешно добавлен пользователь",
                    token: null
                }
                res.status(200).json(result)
            }
        },

        /**
         * Верификация
         * @param {object} body - данные запроса, тело и строка
         */
        verify: {
            rest:{
                method: "POST",
                path: "/verify"
            },
            params: {
				email: "string",
            },
            async handler(body, res){
                for(let data in body){ 
                    if(!data){
                        delete body.data
                    }
                }
                // Проверяем, все ли поля заполнены
                if (!(body?.phone?.length ? 1 : 0) ^ (body?.email?.length ? 1 : 0)) {
                    throw new Error('Для данной операции требуется ОДНО из полей (email, phone)');
                }

                let response;
                try {
                    response = await verificationModule.verifyCredentials(body);
                } catch (e) {
                    console.log(e);
                };
                console.log(response)

                res.status(200).json(response)

            }
        },

        /**
         * Деактивация аккаунта
         * 
         * @param {string} email_address
         * 
         * 
         */
        disable: {
            rest:{
                path: "/disable"
            },
            params: {
                email_address: "string"
            },
            async handler(email_address){
                await pool.query('UPDATE users SET is_activated = false WHERE email_address = $1', [email_address]);
            }
        },
        /**
         * Активация аккаунта
         * 
         * @param {string} email_address
         * 
         * 
         */
        enable: {
            rest:{
                path: "/enable"
            },
            params: {
                email_address: "string"
            },
            async handler(email_address){
                await pool.query('UPDATE users SET is_activated = true WHERE email_address = $1', [email_address]);
            }
        },
        /**
         * Получаем пользователей
         * @param {*} ctx 
         * @returns 
         */
        getUsers: {
            rest: {
                method: "GET",
                path: "/get"
            },
            async handler(ctx) {
                try {

                    const result = await pool.query('SELECT * FROM users');

                    // await pool.end();

                    return { success: true, users: result };
                } catch (error) {
                    this.logger.error(`AUTH SERVICE - Error gettings records from table USERS:`, error.message);
                    throw new ValidationError(`AUTH SERVICE - Error gettings records from table USERS:`, error);
                }
            },
        },

    /**
     * Метод для восстановления пароля
     * @param {object} req - данные запроса, тело и строка
     * @param {object} res - ответ
     */
    passwordRecovery: {
        rest:{
            path: "/recovery"
        },
        params: {
            surname: "string",
            name: "string",
            patronymic: "string",
            email_address: "string",
            phone_number: "string",
            password: "string"
        },
        async handler(body, res, ctx){

            const {surname, name, patronymic, email_address, phone_number, password} = body;
            try{
                // await connectDb();
                await pool.query("BEGIN");

                // Можно обойтись без лишнего SELECT если в БД поставить правило уникальности почты и/или номера телефона
                const isUserVerified = await pool.query('SELECT * FROM users u WHERE u.phone_number = $1 OR u.email_address = $2', [phone_number, email_address]);
                if(isUserVerified.rowCount > 0){
                    throw new Error("Такой юзер уже есть")
                }

                // /* Генерация и привязка токена */
                // const bearer = await createAndBindToken(userid);
                // Тут вставка нового юзера и привзяка ему токена, в Юрте там один токен без срока годности, хранят в Редисе
                const newUserInsert = await pool.query('INSERT INTO users (surname, name, patronymic, email_address, phone_number, password) VALUES ($1, $2, $3, $4, $5, $6)  RETURNING user_id', [surname, name, patronymic, email_address, phone_number, password]);
                await ctx.call("token.save", newUserInsert.rows[0].user_id, await ctx.call("token.generate", {userId: newUserInsert.rows[0].user_id}));


                await pool.query("COMMIT");

            }catch(e){
                console.log(e)

                await pool.query("ROLLBACK");

                const error = {
                    message: "Возникла ошибка регистрации, подробнее: " + e,
                    token: null
                }
                res.status(500).json(error)
            }

            const result = {
                message: "Успешно добавлен пользователь",
                token: null
            }
            res.status(200).json(result)
        }
    },
    },

    created() {},
    started() {},
    stopped() {}
};