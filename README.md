
#  Backend Compute Engagements Average Service
    This application is a service implemented in Nodejs, which computes and logs the average number of social media engagements on  posts on their social media accounts. The service employs two *FIFO Amazon SQS* queues to exchange messages with a fake posts interactions generator which simulates the social media API. Also, the application contains a set of automated tests to ensure that the application runs in the expected way.

## The flow of the service

 1. `fakeGenerator` enqueues interactions with random number engagements *(likes, love, angry, haha)* to **InteractionsIN.fifo**.
 2. `ComputeEngagementsAvgService` consumes interactions from **InteractionsIN.fifo** in the right order.
 3. `ComputeEngagementsAvgService` enriches each message with the total number of engagements and enqueues it to **InteractionsOUT.fifo**.
 4. `ComputeEngagementsAvgService` makes use of the `logAverage` module to log the average number of engagements up to any point to the `log.txt` file along with the timestamp.

## In order to run the project
1. You need to clone the repository
2.  You need to create a `.env` file at the root directory of the repository in the following format
```AWS_ACCESS_KEY_ID=<KEY>
AWS_SECRET_ACCESS_KEY=<KEY>
INQUEUE_URL=<URL>
OUTQUEUE_URL=<URL>
```

3.  Run the following command in the root directory
```node index.js start```
> This will make `fakeGenerator` generate fake conversations at random intervals, and will call `ComputeEngagementsAvgService` continuously to enrich all messages, and log the average.

## In order to run the test, use the following command

```npm test```

### **Notes to consider for testing**

*Amazon SQS* enforces a rule which states that you can purge a queue once every 60 seconds, while the `purgeQueue` command is called before/after some tests to ensure the test runs on empty queues. For this reason, you cannot run the tests more than once per 60 seconds.
> If you executed `npm test` before the 60 seconds, you will run into a **PURGE ERROR**, which will leave the queues with unwanted messages giving inconsistent results.

**For this reason, you need to execute the `node index.js purgeAllQueues` command after 60 seconds from getting this error, to ensure that the application gives right results in subsequent tests/runs.**