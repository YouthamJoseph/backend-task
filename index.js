const ComputeEngamenetsAvgService = require('./services/ComputeEngagementsAvgService')
const { enqueueFakeConv, randomNumber } = require('./utils/fakeGenerator')

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

generateAtRandomIntervals()
ComputeEngamenetsAvgService.run()










// const yargs = require('yargs')

// yargs.command({
//     command: 'stopGenerator',
//     describe: 'Stops the fake generator',
//     handler() {
//         generateFakeConvs = false
//     }
// })
// yargs.command({
//     command: 'stopComputeAvgService',
//     describe: 'Stops the computer average engagements service',
//     handler() {
//         ComputeEngamenetsAvgService.running = false
//     }
// })