import uniqueRandom from 'unique-random';
import colors from 'colors';
import webP from 'webp-converter';
import moment from 'moment';

const rand = uniqueRandom(0, 999999);

export const getRandomItemId = () => rand();

export const getRandomInt = (min, max) => Math.round(Math.random() * (max - min) + min);

export const isObject = (value) => value !== null && typeof value === 'object';

export const getFormattedCurrentDate = () => moment.utc().format('MM-DD-YYYY');

export const log = (msg) => {
  if (isObject(msg)) {
    const objMsg = JSON.stringify(msg, null, ' ');

    // eslint-disable-next-line no-console
    console.log(colors.italic.grey(objMsg));
  } else {
    // eslint-disable-next-line no-console
    console.log(colors.bold.magenta(msg));
  }
};

export const isJSON = (str) => {
  try {
    const obj = JSON.parse(str);
    return isObject(obj);
  } catch (err) {
    return false;
  }
};

export const trimAndLowerCase = (str) => {
  if (typeof str === 'string') {
    return str.trim().toLowerCase();
  }

  return str;
};

// eslint-disable-next-line camelcase
export const convertToWEBPFormat = (filePath, callback) => {
  const newFileName = filePath.split('.')[0];
  webP.cwebp(filePath, `${newFileName}.webp`, '-q 90', (status, error) => {
    callback(error, status);
  });
};
