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
    return;
  }
  
  //match only one of the allowed sizes
  var size = 0;
  if(match[1] === 'xxs')      size = 32;
  else if(match[1] === 'xs')  size = 64;
  else if(match[1] === 's')   size = 128;
  else if(match[1] === 'm')   size = 160;
  else if(match[1] === 'l')   size = 360;
  else if(match[1] === 'xl')  size = 640;
  else if(match[1] === 'xxl') size = 1280;
  else {
    console.log("Error: parameter not allowed", key);
    callback(null, { statusCode: '301', headers: {'location': `${URL}/default.jpg`}, body: ''});     
    return;
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
