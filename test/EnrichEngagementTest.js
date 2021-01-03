const expect = require('chai').expect
const fs = require('fs')
const { sqs, inqueueURL, outqueueURL, messageGroupId } = require('../config')
const ComputeEngagementsAvgService = require('../services/ComputeEngagementsAvgService')
const customAlphabet = require('nanoid').customAlphabet
const nanoid = customAlphabet('1234567890', 11)

const dataBuffer = fs.readFileSync('./test/sample-in.json')
const dataString = dataBuffer.toString()
const conversations = JSON.parse(dataString)

describe('Enriches a received conversation', () => {

    before(() => {
        return new Promise((resolve) => {
            let sendParams = {
                MessageBody: JSON.stringify(conversations[0]),
                MessageGroupId: messageGroupId, //messages with the same groupID are processed in the right order (required field)
                QueueUrl: inqueueURL,
                MessageDeduplicationId: nanoid()
            }

            sqs.sendMessage(sendParams, async (err, data) => {
                if (err) {
                    console.log('Error', err)
                }
                else {
                    await ComputeEngagementsAvgService.run(false)
                    resolve()
                }
            })

        })
    })

    it('Computes the total engagements for a received conversation and enqueues to outqueue', async () => {
        const rcvParams = {
            AttributeNames: [
                "SentTimestamp"
            ],
            MaxNumberOfMessages: 1,
            MessageAttributeNames: [
                "All"
            ],
            QueueUrl: outqueueURL,
            VisibilityTimeout: 20, // The duration (in seconds) that the received messages are hidden from subsequent retrieve requests after being retrieved by a ReceiveMessage request
            WaitTimeSeconds: 5 // The duration (in seconds) for which the call waits for a message to arrive in the queue before returning.
        }
        const receiveMessagePromise = new Promise((resolve, reject) => {
            sqs.receiveMessage(rcvParams, (err, data) => {
                if (err) {
                    reject("Receive Error", err)
                } else if (data.Messages) {
                    const deleteParams = {
                        QueueUrl: outqueueURL,
                        ReceiptHandle: data.Messages[0].ReceiptHandle
                    }
                    sqs.deleteMessage(deleteParams, err => {
                        if (err) {
                            console.log("Delete Error", err)
                        }
                    })
                    resolve(data)
                }
                else
                    reject('No new messages to fetch.')
            })
        })
        const result = await receiveMessagePromise.catch(error => {
            console.log(error)
        })
        if (result) {
            const msgJSON = JSON.parse(result.Messages[0].Body)
            expect(msgJSON.total_engagements).to.equal(80)
        }
    })

    after(() => {
        fs.unlink('./log.txt', (err) => {
            if (err)
                console.log(err)
        })
    })
})