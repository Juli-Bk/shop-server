import mailgunjs from 'mailgun-js';
import validator from 'validator';
import config from './index';

const fromVigo = `${config.mail_user_name} <${config.mail_from}>`;

const mailgun = mailgunjs({
    apiKey: config.mail_api_key,
    domain: config.mail_domain,
});

export const sendEmail = (subject, text, to, from = null, callback) => {

    if (!validator.isEmail(to)) {
        callback(new Error('incorrect email for mailing'));
    }
    if (from && !validator.isEmail(from)) {
        callback(new Error('incorrect from email address'));
    }
    if (!subject) {
        callback(new Error('incorrect subject for mailing'));
    }
    if (!text) {
        callback(new Error('empty text for mailing'));
    }

    const fromOther = `<${from}>`;

    const data = {
        from: fromOther || fromVigo,
        to: to,
        subject: subject,
        text: text,
    };

    mailgun.messages().send(data, function (error, body) {
        emailSendingHandler(error, body, callback);
    });
};

export const sendEmailAddressConfirmation = (emailToConfirm, callback) => {
    if (emailToConfirm && !validator.isEmail(emailToConfirm)) {
        callback(new Error('incorrect email address to confirm'));
    }

    const data = {
        from: fromVigo,
        to: emailToConfirm,
        subject: 'Vigo shop registration',
        template: 'confirm_email',
        'h:X-Mailgun-Variables':
            `{"confirm_email_link": "${config.baseAddress}/confirmation?email=${emailToConfirm}"}`
    };

    mailgun.messages().send(data, function (error, body) {
        emailSendingHandler(error, body, callback);
    });
};

export const sendRecoveryPasswordLetter = (email, token, callback) => {
    if (email && !validator.isEmail(email)) {
        callback(new Error('incorrect email address to password recover'));
    }
    if (!token) {
        callback(new Error('token is required for password recover'));
    }

    const data = {
        from: fromVigo,
        to: email,
        subject: 'Vigo shop password recovery',
        template: 'password_recovery',
        'h:X-Mailgun-Variables':
            `{"vigo_link": "${config.baseAddress}", "reset_password_link": "${config.baseAddress}/recovery?email=${email}&token=${token}"}`
    };

    mailgun.messages().send(data, function (error, body) {
        emailSendingHandler(error, body, callback);
    });
};

const emailSendingHandler = (error, body, callback) => {
    if (error) {
        console.log('💥💥💥 email sending error:  ', error);
        callback && callback(error, body);
    } else {
        if (config.environment === 'development') {
            console.log('🚀🚀🚀 email is sent:  ', body);
        }
        callback(null, 'email is sent');
    }
};