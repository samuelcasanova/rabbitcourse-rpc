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

describe('Service tests', () => {
  beforeAll(() => {
    service.run()
  })

  it('should answer with the correct sum for 2 numbers', async () => {
    const exclusiveQueueName = await consumer.initQueue()
    const requestMessage = consumer.createRequestMessage(2, 2, exclusiveQueueName)
    consumer.sendRequest(requestMessage)
    const responseMessage = await consumer.consumeResponse(exclusiveQueueName)
    consumer.ackResponse(responseMessage)

    expect(responseMessage.result).toBe(4)
  })

  afterAll(async () => {
    await messaging.closeAll()
  })
})