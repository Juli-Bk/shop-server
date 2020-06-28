import mailgunjs from 'mailgun-js';
import validator from 'validator';
import config from './index';

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

    const mailgun = mailgunjs({
        apiKey: config.mail_api_key,
        domain: config.mail_domain,
    });

    const fromVigo = `${config.mail_user_name} <${config.mail_from}>`;
    const fromOther = `<${from}>`;

    const data = {
        from: fromOther || fromVigo,
        to: to,
        subject: subject,
        text: text,
    };

    mailgun.messages().send(data, function (error, body) {
        if (error) {
            console.log('💥💥💥 email sending error:  ', error);
            callback && callback(error);
        }
        if (config.environment === 'development') {
            console.log('🚀🚀🚀 email is sent:  ', body);
        }
        callback(null, 'email is sent');
    });
};