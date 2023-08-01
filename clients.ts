import { Client } from 'pg';
import { APPLICANT_SERVICE } from './secrets';

const applicantDB = new Client({
  user: APPLICANT_SERVICE.USER,
  password: APPLICANT_SERVICE.PASSWORD,
  port: APPLICANT_SERVICE.PORT,
  database: APPLICANT_SERVICE.DATABASE,
  host: APPLICANT_SERVICE.HOST,
});

export {
  applicantDB,
}