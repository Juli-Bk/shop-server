<img height="20px" alt="CI" style="border-radius: 2px;" src="https://img.shields.io/badge/travis ci-%2312100E.svg?&style=for-the-badge&logo=travis&logoColor=white" />[![Build Status](https://travis-ci.com/Juli-Bk/shop-server.svg?branch=master)](https://travis-ci.com/Juli-Bk/shop-server)

## Vigo-Shop server

This is an open-source node server app for [vigo-shop](https://vigo-shop.herokuapp.com) online store.

### It`s built using:

* Node
* Express
* Mongo DB, mongoose
* AWS S3 as file storage (aws-sdk, multer-s3)
* JWT token auth, (jsonwebtoken, passport)
* Mailgun for emailing
* Joi, validator for validation
* Eslint, Postman, Newman, Travis CI
* GIT, GitHub, Jira as a workflow

## To start server locally:

You must have your own environment variables. Just add `.env` file to project root folder.
Use `.env.example` file with guiding comments in it.

To do that you should have your [AWS](https://aws.amazon.com/),
[MailGun](https://www.mailgun.com), 
[Mongo](https://www.mongodb.com),
[LiqPay](https://www.liqpay.ua/ru) 
accounts for filling API keys.

After proper configuration run the command below:

`npm run start`

## Testing

To test REST APIs just import `../postman/VigoShop_postman_collection.json` file in your locally installed [Postman](https://www.postman.com/).
Or fork [public](https://www.getpostman.com/collections/833da82b6af922dd8290) Postman collection.

Set environment variables in `../postman/VigoShop_postman_collection.json` and import the environment into Postman.

After proper configuration you may test APIs using Postman UI or just run the command below:

`npm run integration-tests`

### Testing data

To have some initial data for testing as server starts, set an 
environment variable PERFORM_INITIAL_DATA_IMPORT in .env file to 'true'.

### To debug this server in chrome

Install globally:

`npm i -g node-inspector`

Open chrome and type in:
 
`about:inspect`

Then in opened window press on the link: 

`Open dedicated DevTools for Node`

Ensure your localhost:port is in the list for debugging.
The default ports for node debugging are `9229` and `9222`.
You can add yours here. 
More info you can find [here](https://www.youtube.com/watch?v=F1VZj-zqnG4) and [here](https://nodejs.org/en/docs/guides/debugging-getting-started/).

Now you can start this command in the terminal window:

`npm run start:debug`


### ESLint

[ESLint check](https://www.npmjs.com/package/eslint-plugin-node) 
will run by default by running `start:dev` or `start:debug` commands. 
If there are some troubles with code linting, server will NOT start properly.

### CI

ESLint and Postman integration tests are using in Travis CI. See the .travis.yml file.


