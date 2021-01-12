import validator from 'validator';

class FormValidator {
  constructor(validations) {
    this.validations = validations;
  }

  static checkValidity(validationRules, formInputTypes) {
    return validationRules.filter((rule) => formInputTypes.includes(rule.field));
  }

  static isEmpty(value) {
    return (
      value === undefined
      || value === null
      || (typeof value === 'object' && Object.keys(value).length === 0)
      || (typeof value === 'string' && value.trim().length === 0)
    );
  }

  validate(data) {
    const validation = { isValid: true };
    validation.errors = {};

    this.validations.forEach((rule) => {
      const fieldValue = data[rule.field].toString();
      const args = rule.args || [];
      const { method } = rule;
      const validationMethod = typeof method === 'string' ? validator[method] : method;

      if (validationMethod(fieldValue, ...args, data) !== rule.validWhen) {
        validation.errors = {
          ...validation.errors,
          [rule.field]: rule.message,
        };
        validation.isValid = false;
      }
    });

    return validation;
  }
}

export default FormValidator;
