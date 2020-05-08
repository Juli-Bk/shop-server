import commonValidationRules from "./formValidationRules";
import FormValidator from "./FormValidator";

const validationHelper = (data) => {
    const fields = Object.keys(data);

    const currentValidationRules = FormValidator.checkValidity(
        commonValidationRules,
        fields
    );

    const customValidator = new FormValidator(currentValidationRules);
    return customValidator.validate(data);
};

export default validationHelper;