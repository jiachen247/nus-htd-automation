
const axios = require('axios');
var moment = require('moment');
var moment = require("moment-timezone");
const qs = require('querystring')

exports.handler = async (event) => {
  await run(username, password)
  const response = {
      statusCode: 200,
      body: JSON.stringify('HELLO NUS!!'),
  };
  return response;
};

/* TEMPRETURE TAKER
This script magically sticks a thermometer into your mouth, takes your temp and then reports it to the nus htd portal!
USE AT YOUR OWN RISK LOL
*/

/* Config */
const CLIENT_ID = "97F0D1CACA7D41DE87538F9362924CCB-184318"
const now = moment.tz(Date.now(), "Asia/Singapore").format("DD/MM/YYYY");
const username = process.env.NUSNET_ID;
const password = process.env.NUSNET_PASSWORD;
const isMorning = parseInt(moment.tz(Date.now(), "Asia/Singapore").format("HH")) <12

/* Init */
axios.defaults.headers.common['User-Agent'] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.116 Safari/537.36";
const instance = axios.create();
instance.defaults.timeout = 20000;
const ALLOWED_TEMPS = [
    "35.8", 
    "35.9", 
    "36.0",
    "36.1", 
    "36.2", 
    "36.3", 
    "36.4", 
    "36.5", 
    "36.6", 
    "36.7", 
    "36.8", 
    "36.9", 
    "36.0" 
];

/* Helper Functions */
const get_random_temp = () => ALLOWED_TEMPS[Math.floor(Math.random() * ALLOWED_TEMPS.length)]

async function run(username, password){
  if (!username || !password) {
    return console.log("[ERROR] Missing username and/or password.")
  }
  const code_url = await auth(username, password);
  if (!code_url) {
    return console.log("[ERR] Missing code_url");
  }
  const session_id = await get_session_id(code_url);
  if (!session_id) {
    return console.log("[ERR] Missing session_id");
  }
  await submit_temp(session_id);
  console.log("[SUCCESS]");
}

// Auth call to https://vafs.nus.edu.sg/adfs/oauth2/authorize?response_type=code&client_id=97F0D1CACA7D41DE87538F9362924CCB-184318&resource=sg_edu_nus_oauth&redirect_uri=https://myaces.nus.edu.sg:443/htd/htd
async function auth(username, password){
  /*
    2 API Calls
    Login request woundent work without MSIS auth cookies
  */
  console.log("[AUTH]")
  const auth_url =  'https://vafs.nus.edu.sg/adfs/oauth2/authorize'
  
  const config = {
    maxRedirects: 0,
    headers : {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    params: {
      'response_type': 'code',
      'client_id': CLIENT_ID,
      'resource': 'sg_edu_nus_oauth',
      'redirect_uri': 'https://myaces.nus.edu.sg:443/htd/htd'
    }
  }

  const data = qs.stringify({
    'UserName': 'nusstu\\' + username,
    'Password': password,
    'AuthMethod': "FormsAuthentication"
  })

  const MSISAuthCookie = await axios.post(auth_url, data, config)
    .then(response => response)
    .catch(err => err.response.headers['set-cookie'][0].split(";")[0]) // shoud reach heres due to 302

  config.headers = {
    'Cookie': MSISAuthCookie
  }

  return await axios.post(auth_url, data, config)
    .then(response => response.headers.location)
    .catch(err => err.response.headers.location)
}

async function get_session_id(code_url) {
  console.log(`[GET_SESSION_ID]`)

  const jsessionid = await axios.get(code_url, null)
    .then(response => response.headers['set-cookie'][0].split(";")[0])
    .catch(err => err.response.headers)
  return jsessionid
}

async function submit_temp(session_id) {
  console.log(`[SUBMIT_TEMP] session_id='${session_id}'`)
  const temp = get_random_temp();
  console.log(`[DEBUG] Reporting '${temp}' for ${isMorning ? "AM" : "PM"} on (${now})`)

  const htd_url = "https://myaces.nus.edu.sg/htd/htd";

  const config = {
    headers : {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': session_id
    }
  }
  const data = qs.stringify({
    'actionName': 'dlytemperature',
    'tempDeclOn': now,
    'declFrequency': isMorning ? "A" : "P",
    'temperature': temp,
    'symptomsFlag': "N"
  })
  return await axios.post(htd_url, data, config).then(response => response).catch(err => err.response)
}

// run(username, password);