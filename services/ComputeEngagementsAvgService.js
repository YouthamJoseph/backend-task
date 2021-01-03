const moment = require('moment')
const logAvg = require('../utils/logAverage')
const { sqs, inqueueURL, outqueueURL, messageGroupId } = require('../config')
const customAlphabet = require('nanoid').customAlphabet
const nanoid = customAlphabet('1234567890', 11)

const rcvParams = {
  AttributeNames: [
    "SentTimestamp"
  ],
  MaxNumberOfMessages: 5,
  MessageAttributeNames: [
    "All"
  ],
  QueueUrl: inqueueURL,
  VisibilityTimeout: 20, // The duration (in seconds) that the received messages are hidden from subsequent retrieve requests after being retrieved by a ReceiveMessage request
  WaitTimeSeconds: 0 // The duration (in seconds) for which the call waits for a message to arrive in the queue before returning.
}
let result
const run = async (keepRunning = true) => {
  return new Promise(async (resolve, reject) => {
    do {
      const receiveMessagePromise = new Promise((resolve, reject) => {
        let foundMessages = false

        sqs.receiveMessage(rcvParams, (err, data) => {
          if (err) {
            reject("Receive Error", err)
          } else if (data.Messages) {
            foundMessages = true
            data.Messages.forEach(message => {
              const deleteParams = {
                QueueUrl: inqueueURL,
                ReceiptHandle: message.ReceiptHandle
              }
              sqs.deleteMessage(deleteParams, (err, data) => {
                if (err) {
                  console.log("Delete Error", err)
                }
              })
            })
            resolve(data)
          }
          else
            resolve('No new messages to fetch. RETRYING...')
        })
      })
      result = await receiveMessagePromise.catch(error => {
        console.log(error)
        // reject(error)
      })
    } while (!result.Messages)
    //Enqueue enriched message & Log average
    if (result) {
      result.Messages.forEach(message => {
        let msgJSON = JSON.parse(message.Body)
        //Enrich the conv
        const timestamp = moment().format('DD-MM-YYYY hh:MM A')
        let sum = 0
        Object.keys(msgJSON.engagements).forEach(type => sum += msgJSON.engagements[type])
        msgJSON.total_engagements = sum

        //Enqueue to outqueue
        const sendParams = {
          MessageBody: JSON.stringify(msgJSON),
          MessageGroupId: messageGroupId, //messages with the same groupID are processed in the right order (required field)
          QueueUrl: outqueueURL,
          MessageDeduplicationId: nanoid(),
        }

        sqs.sendMessage(sendParams, (err, data) => {
          if (err) {
            console.log('Error', err)
          } else {
            console.log('ENRICHED MESSAGE ENQUEUED TO OUTQUEUE, ID:', data.MessageId)
          }
        })

        //logging the average to a file
        logAvg(sum, timestamp)

      })
      resolve()
    }


    //to keep running
    //since the callback gets queued, and once it's resolved, it's called again, a stack overflow would never happen.
    keepRunning ? run() : console.log('Service stopped.')
  })

}


module.exports = { run }