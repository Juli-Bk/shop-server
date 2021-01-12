import FormValidator from './validation/FormValidator';
import { isJSON } from './helper';

const excludedParams = ['letterSubject', 'letterHtml'];

const queryCreator = (data) => Object
  .keys(data)
  .reduce((queryFieldsObj, parameterName) => {
    const fields = { ...queryFieldsObj };
    if (isJSON(data[parameterName])) {
      fields[parameterName] = JSON.parse(data[parameterName]);
    } else if (!FormValidator.isEmpty(data[parameterName])
                && !excludedParams.includes(parameterName)
    ) {
      fields[parameterName] = data[parameterName];
    }

    return fields;
  }, {});

export default queryCreator;
