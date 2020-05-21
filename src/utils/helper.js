import uniqueRandom from 'unique-random';
import util from 'util';
import colors from 'colors';
import webP from "webp-converter";

const rand = uniqueRandom(0, 999999);

export const getRandomItemId = () => rand();

export const log = (msg) => {
    if (util.isObject(msg)) {
        const objMsg = JSON.stringify(msg, null, ' ');
        console.log(colors.italic.grey(objMsg));
    } else {
        console.log(colors.bold.magenta(msg));
    }
};

export const isJSON = (str) => {
    try {
        //todo deprecated usage util.isNullOrUndefined
        const obj = JSON.parse(str);
        return !util.isNullOrUndefined()
            && util.isObject(obj);

    } catch (err) {
        return false;
    }
};

export const convertTo_WEBP_format = (filePath, callback) => {
    const newFileName = filePath.split('.')[0];
    webP.cwebp(filePath, `${newFileName}.webp`, "-q 90", function (status, error) {
        callback(error, status);
    });
}
