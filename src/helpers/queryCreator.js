import FormValidator from './validation/FormValidator';
import {isJSON} from './helper';

const excludedParams = ['letterSubject', 'letterHtml'];

const queryCreator = (data) => {

    return Object
        .keys(data)
        .reduce((queryFieldsObj, parameterName) => {

            if (isJSON(data[parameterName])) {
                queryFieldsObj[parameterName] = JSON.parse(data[parameterName]);
            } else if (!FormValidator.isEmpty(data[parameterName])
                && !excludedParams.includes(parameterName)
            ) {
                queryFieldsObj[parameterName] = data[parameterName];
            }

            return queryFieldsObj;

        }, {});

};

export default queryCreator;