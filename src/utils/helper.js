import uniqueRandom from "unique-random";
import util from "util";
import colors from "colors";

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
        const obj = JSON.parse(str);
        return !util.isNullOrUndefined()
            && util.isObject(obj);

    } catch (err) {
        return false;
    }
};
