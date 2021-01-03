const fs = require('fs')
const customAlphabet = require('nanoid').customAlphabet
const nanoid = customAlphabet('1234567890', 11)
const { sqs, inqueueURL, outqueueURL, messageGroupId } = require('../config')

const randomNumber = (min, max) => Math.floor(Math.random() * (max - min) + min)

const generateConvObject = () => {
  const conv = {
    "id": nanoid(),
    "type": "post",
    "source": "facebook",
    "link": "https://facebook.com/fake-post",
    "username": "faker fake",
    "engagements": {
      "likes": randomNumber(0, 100),
      "love": randomNumber(0, 100),
      "haha": randomNumber(0, 100),
      "angry": randomNumber(0, 100)
    }
  }
  return conv
}

const enqueueFakeConv = () => {
  const conv = JSON.stringify(generateConvObject())
  let params = {
    MessageBody: conv,
    MessageGroupId: messageGroupId, //messages with the same groupID are processed in the right order (required field for FIFO queues)
    QueueUrl: inqueueURL,
    MessageDeduplicationId: nanoid()
  }

  sqs.sendMessage(params, (err, data) => {
    if (err) {
      console.log('Error', err)
    } else {
      console.log('FAKE MESSAGE GENERATED AND ENQUEUED TO THE INQUEUE, ID:', data.MessageId)
    }
  })
}

module.exports = { enqueueFakeConv, randomNumber }