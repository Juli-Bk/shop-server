import dotenv from 'dotenv';
import joi from 'joi';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();

if (!envFound) {
    throw new Error('⚠ Couldn\'t find .env file. Please check the .env.example and create your own copy of that file. ⚠');
}

const envVarsSchema = joi.object({
    NODE_ENV: joi.string()
        .allow('development', 'production', 'test')
        .required(),
    PORT: joi.number()
        .required(),

    LIQPAY_PRIVATE_KEY: joi.string()
        .required(),

    AWS_ACCESS_KEY_ID: joi.string()
        .required(),
    AWS_BUCKET_NAME: joi.string()
        .required(),
    AWS_SECRET_ACCESS_KEY: joi.string()
        .required(),

    SECRET_OR_KEY: joi.string()
        .required(),
    JWT_EXPIRES: joi.number()
        .required(),

    MONGO_URI: joi.string()
        .uri()
        .required(),

    MAILGUN_FROM: joi.string()
        .email()
        .required(),
    MAILGUN_API_KEY: joi.string()
        .required(),
    MAILGUN_DOMAIN: joi.string()
        .required(),
    MAILGUN_USER_NAME: joi.string()
        .required(),

    IMAGE_BASE_URL: joi.string()
        .uri()
        .required(),

    CLIENT_BASE_ADDRESS: joi.string()
        .uri()
        .required(),
    ALLOW_CORS: joi.boolean()
        .truthy('TRUE')
        .truthy('true')
        .falsy('FALSE')
        .falsy('false')
        .default(true),

    MONGO_DEBUG_MODE: joi.boolean()
        .truthy('TRUE')
        .truthy('true')
        .falsy('FALSE')
        .falsy('false')
        .default(false)
})
    .unknown()
    .required()

const { error, value: envVars } = envVarsSchema.validate(process.env)
if (error) {
    throw new Error(`Config validation error: ${error.message}`)
}

export default {
    port: parseInt(envVars.PORT, 10),
    DB_string: envVars.MONGO_URI,
    allowCors: envVars.ALLOW_CORS,
    mongoDebugMode: envVars.MONGO_DEBUG_MODE,
    environment: envVars.NODE_ENV,
    secret: envVars.SECRET_OR_KEY,
    imageStorageBaseAddress: envVars.IMAGE_BASE_URL,
    //Signing a token with 1 hour of expiration by default on production
    expiresInMinutes: envVars.NODE_ENV === 'development'
         ? 1
        : envVars.JWT_EXPIRES,
    tokenPrefix: 'Bearer',
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    bucket: envVars.AWS_BUCKET_NAME,
    mail_api_key: envVars.MAILGUN_API_KEY,
    mail_domain: envVars.MAILGUN_DOMAIN,
    mail_from: envVars.MAILGUN_FROM,
    mail_user_name: envVars.MAILGUN_USER_NAME,
    baseAddress:  envVars.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : envVars.CLIENT_BASE_ADDRESS,
    liqpay_private_key: envVars.LIQPAY_PRIVATE_KEY
};
