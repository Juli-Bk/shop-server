Travis CI

[![Build Status](https://travis-ci.com/Juli-Bk/shop-server.svg?branch=master)](https://travis-ci.com/Juli-Bk/shop-server)

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
* Eslint, Travis CI
* GIT, GitHub, Jira as a workflow


## Testing

To test some REST APIs you can use already deployed [vigo-server](https://vigo-server.herokuapp.com).
Some APIs are allowed for only admin user. That will be unavailable for you because of security reasons.

Just export `../public/VigoShop_postman_collection.json` file in your locally installed [Postman](https://www.postman.com/) to get **all list of requests**.

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

### Testing data

To have some data for testing as server starts set PERFORM_INITIAL_DATA_IMPORT=true

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

[ESLint check](https://www.npmjs.com/package/eslint-plugin-node) will run by default by running `start:dev` or `start:debug` commands. 
If there are some troubles with code linting, server will NOT start properly.


