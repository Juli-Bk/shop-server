## Shop server


### To start this server:

To configure your environment variables add `.env` file to project root folder.

Use `.env.example` file to fill your own `.env` file. 

`.env` files are in `.gitignore`, so you can configure your own file as you want. [Learn more](https://medium.com/the-node-js-collection/making-your-node-js-work-everywhere-with-environment-variables-2da8cdf6e786)


Use [Mongo plugin](https://github.com/dboissier/mongo4idea) to check DB changes and test API requests.


## To debug in chrome

Install globally:

`npm i -g node-inspector`

Open chrome and type in:
 
 `about:inspect`

Then in opened window press on link: 

`Open dedicated DevTools for Node`

Ensure your localhost:port is in the list for debugging.
The default ports for node debugging are `9229` and `9222`. `9229` is in `.env` by default
You can add yours here. [More info here](https://www.youtube.com/watch?v=F1VZj-zqnG4) and [here](https://nodejs.org/en/docs/guides/debugging-getting-started/)

Now you can start this command in the terminal window:

`npm run start:debug`


### [ESLint check](https://www.npmjs.com/package/eslint-plugin-node) 
will run by default by running `start:dev` or `start:debug` command in terminal window.
