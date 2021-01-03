const fs = require('fs')

let currentAvg
let numOfConvs = 0

const logAvg = (sum, timestamp) => {

    if (numOfConvs === 0) {
        fs.appendFileSync('log.txt', timestamp + ' -> ' + sum)
        currentAvg = sum
    } else {
        let newAvg = (currentAvg * numOfConvs + sum) / (numOfConvs + 1)
        fs.appendFileSync('log.txt', '\r\n' + timestamp + ' -> ' + newAvg)
        currentAvg = newAvg
    }

    numOfConvs++
}

module.exports = logAvg