const ComputeEngamenetsAvgService = require('./services/ComputeEngagementsAvgService')
const { enqueueFakeConv, randomNumber } = require('./utils/fakeGenerator')
const { sqs, inqueueURL, outqueueURL} = require('./config')
const yargs = require('yargs')

let generateFakeConvs = true

//Generate fake conversations at random intervals
const waitRandomInterval = interval => new Promise(resolve => setTimeout(() => {
    resolve()
}, interval))

const generateAtRandomIntervals = async () => {
    while (generateFakeConvs) {
        const randomInterval = randomNumber(1, 4) * 1000 //generate a random engagement every 1, 2, or 3 seconds
        await waitRandomInterval(randomInterval)
        enqueueFakeConv()
    }
}


yargs.command({
    command: 'start',
    describe: 'starts the service along with the generator',
    handler() {
        generateAtRandomIntervals()
        ComputeEngamenetsAvgService.run()        
    }
})

yargs.command({
    command: 'purgeAllQueues',
    describe: 'purges all queues to ensure consistent results. NB: Can only run once every 60 seconds',
    handler() {
        sqs.purgeQueue({ QueueUrl: outqueueURL }, (err) => {
            if (err) console.log('PURGE ERROR: ' + err)
            else console.log('OUTQUEUE purged successfully')
        })
        sqs.purgeQueue({ QueueUrl: inqueueURL }, (err) => {
            if (err) console.log('PURGE ERROR: ' + err)
            else console.log('INQUEUE purged successfully')
        })
    }
})

yargs.parse()
