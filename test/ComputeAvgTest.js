const expect = require('chai').expect
const fs = require('fs')
const { sqs, inqueueURL, outqueueURL, messageGroupId } = require('../config')
const ComputeEngagementsAvgService = require('../services/ComputeEngagementsAvgService')
const customAlphabet = require('nanoid').customAlphabet
const nanoid = customAlphabet('1234567890', 11)

const dataBuffer = fs.readFileSync('./test/sample-in.json')
const dataString = dataBuffer.toString()
const conversations = JSON.parse(dataString)

describe('Computes the average number of engagements', () => {

    before(() => {
        return new Promise((resolve) => {
            //delete log file if it exists
            fs.unlink('./log.txt', () => {})
            let params = {
                Entries: [
                    {
                        Id: '1',
                        MessageBody: JSON.stringify(conversations[0]),
                        MessageGroupId: messageGroupId,
                        MessageDeduplicationId: nanoid()
                    },
                    {
                        Id: '2',
                        MessageBody: JSON.stringify(conversations[1]),
                        MessageGroupId: messageGroupId,
                        MessageDeduplicationId: nanoid()
                    },
                    {
                        Id: '3',
                        MessageBody: JSON.stringify(conversations[2]),
                        MessageGroupId: messageGroupId,
                        MessageDeduplicationId: nanoid()
                    },
                    {
                        Id: '4',
                        MessageBody: JSON.stringify(conversations[3]),
                        MessageGroupId: messageGroupId,
                        MessageDeduplicationId: nanoid()
                    }
                ],
                QueueUrl: inqueueURL
            }
            sqs.sendMessageBatch(params, (err, data) => {
                if (err) console.log(err, err.stack)
                else {
                    resolve(data)
                }
            })

        })
    })

    it('logs the average correctly after every received conversation', () => {

        return new Promise(async (resolve) => {
            const res = await ComputeEngagementsAvgService.run(false)
            if (res) {
                const logBuffer = fs.readFileSync('./log.txt')
                const logString = logBuffer.toString()
                const lines = logString.split('\r\n')
                expect(lines).to.have.lengthOf(4)
                expect(parseFloat(lines[0].split(' ')[4])).to.equal(80)
                expect(parseFloat(lines[1].split(' ')[4])).to.equal(89.5)
                expect(parseFloat(lines[2].split(' ')[4])).to.equal(60)
                expect(parseFloat(lines[3].split(' ')[4])).to.equal(48.75)

            }
            resolve()
        })
    })

    after(() => {
        return new Promise((resolve) => {
            //delete log file and purge outqueue
            fs.unlink('./log.txt', (err) => {
                if (err)
                    console.log(err)
            })
            sqs.purgeQueue({ QueueUrl: outqueueURL }, (err, data) => {
                if (err) console.log('PURGE ERROR: ' + err)
                else resolve(data)
            })
        })

    })

})