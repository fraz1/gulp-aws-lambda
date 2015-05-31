/*
 Use the aws s3 example script
*/
var dotenv = require('dotenv').load();
var aws = require('aws-sdk');
var pg = require('pg');

var s3 = new aws.S3({
  apiVersion: '2006-03-01'
});
var conString = process.env.DB_CONN;
var db = new pg.Client(conString);

exports.handler = function(event, context) {
  var bucket = event.Records[0].s3.bucket.name;
  var key = event.Records[0].s3.object.key;

  s3.getObject({
    Bucket: bucket,
    Key: key
  }, function(err, data) {
    if (err) {
      console.log("Error getting object " + key + " from bucket " + bucket +
        ". Make sure they exist and your bucket is in the same region as this function.");
      context.fail('Error', "Error getting file: " + err);
    } else {
      var body = JSON.parse(data.Body.toString());
      console.log('MessageID:' + body.MessageID);
      processData(body);
    }
  });


  /*
    Read some JSON and copy the object to an additional bucket
  */
  function processData(body) {
    var copyToKey = '111/111/' + body.MessageID;

    var copyParams = {
      Bucket: process.env.DESTINATION_BUCKET,
      Key: copyToKey,
      CopySource: bucket + '/' + key
    };

    s3.copyObject(copyParams, function(err, data) {
      if (err) {
        console.log('ERROR S3 copyObject. ' + err);
        context.fail('Error', "Error getting file: " + err);
      } else {
        console.log('SUCCESS copyObject to ' + copyToKey);
        context.succeed();
      }
    });

  }

};
