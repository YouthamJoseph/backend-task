const expect = require('chai').expect
const { sqs, inqueueURL } = require('../config')
const { enqueueFakeConv } = require('../utils/fakeGenerator')


describe("Generates a fake conversation", () => {

    before(() => {
        return new Promise((resolve) => {
            sqs.purgeQueue({ QueueUrl: inqueueURL }, (err, data) => {
                if (err) console.log('PURGE ERROR: ' + err)
                else resolve(data)
            })
        })
    })

    it("Generates and enqueues a fake conversation in the right format", async () => {
        enqueueFakeConv()
        
        const receiveParams = {
            AttributeNames: [
                "SentTimestamp"
            ],
            MaxNumberOfMessages: 10, //to make sure we get all the messages in the queue
            MessageAttributeNames: [
                "All"
            ],
            QueueUrl: inqueueURL,
            VisibilityTimeout: 20,
            WaitTimeSeconds: 5 //to make sure that the message that was just sent (from the enqueueFakeConv() call) gets received.
        }

        const receivePromise = new Promise((resolve, reject) => {
            sqs.receiveMessage(receiveParams, function (err, data) {
                if (err) {
                    reject("Receive Error" + err)
                } else if (data.Messages) {
                    const deleteParams = {
                        QueueUrl: inqueueURL,
                        ReceiptHandle: data.Messages[0].ReceiptHandle
                    }
                    sqs.deleteMessage(deleteParams, err => {
                        if (err) {
                            console.log("Delete Error", err)
                        }
                    })
                    resolve(data.Messages)
                }
            })
        }).catch(error => console.log(error))

        const res = await receivePromise
        const message = JSON.parse(res[0].Body)
        expect(res).to.have.lengthOf(1)
        expect(message).to.have.all.keys('id', 'type', 'source', 'link', 'username', 'engagements')
        expect(message.engagements.likes).to.be.a('number')
        expect(message.engagements.love).to.be.a('number')
        expect(message.engagements.haha).to.be.a('number')
        expect(message.engagements.angry).to.be.a('number')

    })

})

