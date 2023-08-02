const grant_applicant = require('./dboutput/grant_applicant.json');
const grant_submission = require('./dboutput/grant_submission.json');
import { createReadStream, writeFile } from 'fs';
import { applicantDB } from './clients';
const readline = require('readline');
const relevantLines = require('./relevantLines.json');
const fileStream = createReadStream('./output.txt');

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

const main = async () => {
  //Map over the lines with rl and filter on with RELEVANT_LINE_FILTER_STRING
  //const RELEVANT_LINE_FILTER_STRING = 'Before request [GET /apply/api/applicant/submissions/';
  const uniqueSubmissions = new Set();
  const uniqueSubs = new Set();
  const uniqueEmails = new Set();

  //loop over the lines and check if the sub from jwt matches the author of the submission
  relevantLines.forEach((line: string) => {
    const jwt = parseInputStringGetTheJWTUsingRegex(line);
    const submissionId = extractNext36Characters(
      line,
      'Before request [GET /apply/api/applicant/submissions/'
    );
    const createdBy = getCreatedByForCurrentSubmissionid(submissionId as string);
    const sub = getSubFromCreatedBy(createdBy);
    const data = parseJwt(jwt);

    if (sub !== data.sub) {
      //OH NO!
      uniqueEmails.add(data.email);
      uniqueSubmissions.add(submissionId)
      uniqueSubs.add(data.sub);
      console.log({jwtSub: data.sub, sub, submissionId })
    }
  });

  console.log('unique submission ids', uniqueSubmissions);
  console.log('unique emails', uniqueEmails);
  console.log('submissions', uniqueSubmissions)
};

const getSubFromCreatedBy = (createdBy: string) => {
  const result = grant_applicant.find((user: ApplicantUser) => user.id === createdBy);
  return result.user_id;
};

const getCreatedByForCurrentSubmissionid = (submissionId: string) => {
  const result = grant_submission.find(
    (application: GrantApplication) => application.id === submissionId
  );
  return result.created_by;
};

function extractNext36Characters(inputString: string, magicKeyword: string) {
  const magicKeywordPosition = inputString.indexOf(magicKeyword);
  if (
    magicKeywordPosition !== -1 &&
    magicKeywordPosition + magicKeyword.length + 36 <= inputString.length
  ) {
    const extractedString = inputString.substring(
      magicKeywordPosition + magicKeyword.length,
      magicKeywordPosition + magicKeyword.length + 36
    );
    return extractedString;
  } else {
    return null; // Magic keyword not found or there are not enough characters after the keyword
  }
}

const parseInputStringGetTheJWTUsingRegex = (inputString: string) => {
  const regex = /Bearer ([a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+)/gm;
  let m;
  let result = '';
  while ((m = regex.exec(inputString)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    result = m[1];
  }
  return result;
};

function parseJwt(token: string) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

type ApplicantUser = {
  id : string
  user_id : string
}

type GrantApplication = {
  id : string
  application_name : string
  applicant_id : string
  application_id : string
}

// const outputResultToJson = (result: string[]) => {
//   writeFile('relevantLines.json', JSON.stringify(result), (err) => {
//     if (err) {
//       throw err; 
//     }
//     console.log('JSON data is saved.');
//   });
// };

main();