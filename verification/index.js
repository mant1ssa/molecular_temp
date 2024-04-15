const verificationMethods = require('./adapters/methods');

const getRequestOperator = (phone) => phone ? 'SMS' : 'MAIL';

/**
 * Метод перенаправляет на методы аутентификации
 * @param {object} body - данные запроса, тело и строка
 */
const verifyCredentials = async ({ phone, email, code }) => {

    // Инициализация объекта, содержащего разные операторы
    const currentVerificationMethod = verificationMethods['ACCOUNT_AUTH'];

    const requestOperator = getRequestOperator(phone);
    console.log("requestOperator: ", requestOperator);

    // Запрос к нужному сервису 
    const response = await currentVerificationMethod[requestOperator]({ phone, email, code });

    return response;
}

/**
 * Метод перенаправляет на методы восстановления пароля
 * @param {object} body - данные запроса, тело и строка
 */
const recoverPassword = async ({ phone, email, code }) => {

    console.log("rec")

    // Инициализация объекта, содержащего разные операторы
    const currentVerificationMethod = verificationMethods['PASSWORD_RECOVERY'];

    const requestOperator = getRequestOperator(phone);
    console.log("requestOperator: ", requestOperator);

    // Запрос к нужному сервису 
    const response = await currentVerificationMethod[requestOperator]({ phone, email, code });

    return response;
}

module.exports = { verifyCredentials, recoverPassword };