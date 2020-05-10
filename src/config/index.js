import dotenv from 'dotenv';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();

if (!envFound) {
    throw new Error(`⚠ Couldn't find .env file. Please check the .env.example and create your own copy of that file. ⚠`);
}

export default {
    port: parseInt(process.env.PORT, 10),
    DB_string: process.env.MONGO_URI,
    allowCors: process.env.ALLOW_CORS,
    environment: process.env.NODE_ENV,
    secret: process.env.SECRET_OR_KEY,
    //Signing a token with 1 hour of expiration by default on production
    expiresInMinutes: process.env.NODE_ENV === "development"
        ? 45000
        : process.env.JWT_EXPIRES || 60
    ,
    tokenPrefix: "Bearer"
};
