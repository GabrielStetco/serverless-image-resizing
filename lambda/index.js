'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const Sharp = require('sharp');

const BUCKET = process.env.BUCKET;
const URL = process.env.URL;

exports.handler = function(event, context, callback) {

  const key = event.queryStringParameters.key;
  
  //match only letters sxlm
  const match = key.match(/([xlms]+)\/(.*)/);
  //exit if the match is wrong
  if(!match || !match[1] || !match[2]) {
    console.log("Error: missing or wrong key", key);
    callback(null, { statusCode: '301', headers: {'location': `${URL}/default.jpg`}, body: ''});
  }
  
  //match only one of the allowed sizes
  if(match[1] === 'xxs') const size = 32;
  else if(match[1] === 'xs') const size = 64;
  else if(match[1] === 's') const size = 128;
  else if(match[1] === 'm') const size = 160;
  else if(match[1] === 'l') const size = 360;
  else if(match[1] === 'xl') const size = 640;
  else if(match[1] === 'xxl') const size = 1280;
  else {
    console.log("Error: parameter not allowed", key);
    callback(null, { statusCode: '301', headers: {'location': `${URL}/default.jpg`}, body: ''});     
  }
  
  const originalKey = match[2];

  S3.getObject({Bucket: BUCKET, Key: originalKey}).promise()
    .then(data => Sharp(data.Body)
      .resize(size, size)
      .toFormat('png')
      .toBuffer()
    )
    .then(buffer => S3.putObject({
        Body: buffer,
        Bucket: BUCKET,
        ContentType: 'image/png',
        Key: key,
      }).promise()
    )
    .then(() => callback(null, {
        statusCode: '301',
        headers: {'location': `${URL}/${key}`},
        body: '',
      })
    )
    .catch(err => callback(null, {
        statusCode: '301',
        headers: {'location': `${URL}/default.jpg`},
        body: ''
      }))
}
