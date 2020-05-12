import config from '../config/index';

const schemaOptions = {
    //if client pass extra props, they will not be saved in DB
    strict: true,
    //`strength: 1` means MongoDB will ignore case when matching.
    collation: {locale: 'en_US', strength: 1},
    autoIndex: config.environment === 'development'
};

export default schemaOptions;