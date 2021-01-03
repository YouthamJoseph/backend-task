let AWS = require('aws-sdk')
const dotenv = require('dotenv')

//loading .env file
const loadEnv = dotenv.config()
if (loadEnv.error)
    throw loadEnv.error

//Setting up AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-2'
})

let sqs = new AWS.SQS({ apiVersion: '2012-11-05' })
const inqueueURL = process.env.INQUEUE_URL
const outqueueURL = process.env.OUTQUEUE_URL
const messageGroupId = 'Group1'

module.exports = {
    sqs,
    inqueueURL,
    outqueueURL,
    messageGroupId
}