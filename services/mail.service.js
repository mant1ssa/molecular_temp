const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
dotenv.config();


// ************* Logging ************** //

// const timestamp = () => '[' + (new Date()).toLocaleString('ru-RU') + ']';
 
const smtp = nodemailer.createTransport({
    pool: true,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL_SMTP_ADDRESS,
        pass: process.env.EMAIL_SMTP_PASSWORD
    }
});

smtp.transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

module.exports = { 
    name: 'mail',
    settings: {

    },
    actions: {
        /** 
         * @param {string} email_address
         * @param {string} code
         * 
        */
        sendmail: {
            rest:{
                method: "POST",
                path: "/send"
            },
            params: {
                email_address: "string",
                code: "string"
            },
            async handler(email_address, code) {
                let result = await smtp.sendMail({
                    from: 'fater45top@yandex.ru',
                    to: `${email_address}`,
                    subject: 'Message from Node js',
                    text: `${code}`
                });
                return result;
            }
        }
    },
    created() {},
    started() {},
    stopped() {}
};