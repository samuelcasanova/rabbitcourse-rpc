import Consumer from "../consumer"
import Logger from "../logging"
import Messaging from "../messaging"
import Service from "../service"

const mockLogger = {
  info: () => {},
  error: () => {},
} as unknown as Logger
const messaging = new Messaging()
const service = new Service(messaging, mockLogger)
const consumer = new Consumer(messaging, mockLogger)
let exclusiveQueueName: string

describe('Service tests', () => {
  beforeAll(async () => {
    service.run()
    exclusiveQueueName = await consumer.initQueue()
  })

  it('should answer with the correct sum for 2 numbers', async () => {
    const requestMessage = consumer.createRequestMessage(2, 2, exclusiveQueueName)
    consumer.sendRequest(requestMessage)
    const responseMessage = await consumer.consumeResponse(exclusiveQueueName)
    consumer.ackResponse(responseMessage)

    expect(responseMessage.result).toBe(4)
  })

  it('should answer with the correct sum with 5 iterations', async () => {
    for (let i = 0; i < 5; i++) {
      const requestMessage = consumer.createRequestMessage(i, i, exclusiveQueueName)
      consumer.sendRequest(requestMessage)
      const responseMessage = await consumer.consumeResponse(exclusiveQueueName)
      consumer.ackResponse(responseMessage)

      expect(responseMessage.result).toBe(i + i)
    }
  })

  it('should answer correctly with a queue previously filled with requests', async () => {
    for (let i = 0; i < 5; i++) {
      const requestMessage = consumer.createRequestMessage(i, i, exclusiveQueueName)
      consumer.sendRequest(requestMessage)
    }

    for (let i = 0; i < 5; i++) {
      const responseMessage = await consumer.consumeResponse(exclusiveQueueName)
      consumer.ackResponse(responseMessage)

      expect(responseMessage.result).toBe(i + i)
    }
  })

  afterAll(async () => {
    await messaging.closeAll()
  })
})