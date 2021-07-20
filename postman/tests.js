import newman from 'newman';
import * as testCollection from './VigoShop.postman_collection.json';
import * as postmanEnvironment from './VigoDevEnvironment.postman_environment.json';
import { getFormattedCurrentUTCDateTime, log } from '../src/helpers/helper';
import config from '../src/config';
import signUpRecover from '../src/auth/authJWTRecover';

let email = '';
const envValues = postmanEnvironment.values.map((variable) => {
  const { key, value } = variable;
  if (key === 'email') { email = value; }
  return { key, value };
});

const token = signUpRecover({ email }, config.secret);

const environment = { ...postmanEnvironment };
environment.values = [
  ...envValues,
  // sensitive data, not for git storage:
  { key: 'url', value: config.serverBaseAddress },
  { key: 'sendFrom', value: `${config.mail_from}` },
  { key: 'mailgundomain', value: `${config.mail_domain}` },
  { key: 'mailgunpassword', value: `${config.mail_api_key}` },
  { key: 'liq_pay_private_key', value: `${config.liqpay_private_key}` },
  { key: 'liq_pay_public_key', value: `${config.liqpay_public_key}` },
  { key: 'token', value: token },
];

// todo print the link in console? to open an report, send a message with report?

const reportPath = `./postman/results/tests-report-${getFormattedCurrentUTCDateTime()}-UTC.html`;
newman.run({
  collection: testCollection,
  reporters: ['cli', 'htmlextra'],
  reporter: {
    htmlextra: {
      export: reportPath,
      title: 'Vigo-server - Newman Report',
      hideRequestBody: ['send MAILGUN API', 'LiqPay'],
      skipEnvironmentVars: ['liq_pay_private_key', 'mailgunpassword', 'token'],
    },
  },
  workingDir: './postman/data/',
  environment,
}, (err) => {
  if (err) { throw err; }
  log('collection run complete!');
});
