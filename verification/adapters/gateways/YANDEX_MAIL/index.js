const { pool } = require("../../../../mixins/db.mixin.js");
const redis = require("../../../../redis/index.js");
const { sendMail } = require("../../../../services/mail.service.js");



const recoveryCodeLength = 6;
const revoceryCodeMaxValue = (10 ** recoveryCodeLength - 1);

/** Генератор кода аутентификации */
const codeGenerator = () => Math.round(Math.random() * revoceryCodeMaxValue).toString().padStart(recoveryCodeLength, '0'); // cryptographically weak?


 
/** HTML-макет письма на почту, с самим кодом */
const accountVerifyBody = ({ verificationCode }) => `\
    <p>Для верификации своей учётной записи в личном кабинете «Юрта» используйте код <b>${verificationCode}</b>.
    <br>Код действителен в течение ${0} минут.</p>
    <p>Если вы не запрашивали восстановление доступа, то просто проигнорируйте это сообщение.</p>
`;





/**
 * Генерация кода, и ее отправка на почту email
 * @param {number} userid Идентификатор учётной записи пользователя
 */
const mailVerification = async ({ email, code }) => {


    let userId;
    try {
        userId = await pool.query('SELECT user_id FROM users WHERE email_address = $1', [email]);
    } catch (e) {
        // if (e instanceof pgp.errors.QueryResultError && e.code === pgp.errors.queryResultErrorCode.noData) {
        //     throw new VerificationError(VerificationError.codes.noSuchUser);
        // }
        console.log(e)
    }

    const userVerifyCode = "Yurta:user:" + userId.rows[0].user_id;
    const isUserVerifyCode = await redis.get(userVerifyCode)

    if(!isUserVerifyCode){

        /** Код аутентификации */
        const verificationCode = codeGenerator();

        redis.set(userVerifyCode, verificationCode)

        /* Формирование сообщения */
        const options = {
            from: process.env.EMAIL_SMTP_ADDRESS,
            to: email,
            subject: 'Тестовая отправка кода верификации',
            html: accountVerifyBody({
                verificationCode
            })
        }

        /* Отправка сообщения */
        console.log(options)
        await sendMail(options);

        return `Выслан код на ${email}`
    }else{
        return "Код уже выслан"
    }
}

/**
 * Восстановление пароля
 * @param {object} emailCode Идентификатор учётной записи пользователя
 */
const recover = async ({ email, code }) => {

    const redisPasswordRecoverKey = "yurta:recover_password:";

    let userId;
    try {
        userId = await pool.query('SELECT user_id FROM users WHERE email_address = $1', [email]);
    } catch (e) {
        console.log(e)

        throw new Error ("no user with email " + email + ", error: ", e);
    }

    const userPswRecoverCode = redisPasswordRecoverKey + userId.rows[0].user_id;
    const isUserPswRecoverCode = await redis.get(userPswRecoverCode)

    if(!isUserPswRecoverCode){

        /** Код аутентификации */
        const verificationCode = codeGenerator();

        redis.set(userPswRecoverCode, verificationCode)

        /* Формирование сообщения */
        const options = {
            from: process.env.EMAIL_SMTP_ADDRESS,
            to: email,
            subject: 'Тестовая отправка кода верификации',
            html: accountVerifyBody({
                verificationCode
            })
        }

        /* Отправка сообщения */
        console.log(options)
        await sendMail(options);

        return `Выслан код на ${email}`
    }else{
        return "Код уже выслан"
    }
}

module.exports = { mailVerification, recover }