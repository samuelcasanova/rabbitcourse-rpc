import { RequestMessage, ResponseMessage } from './message'
import Messaging from './messaging'
import Logger from './logging'

const channelName = 'service'
const queueName = 'q.rpc'

class Service {
  _logger: Logger
  
  constructor() {
    this._logger = new Logger('Service')
  }

  processMessage(request: RequestMessage) : ResponseMessage {
    return { 
      result: request.a + request.b,
      properties: {
        correlationId: request.properties.correlationId
      }
    }
  }

  async run() {
    try {
      const messaging = new Messaging()
      await messaging.createChannel(channelName, 1)
      this._logger.info(`Channel ${channelName} created`)
      await messaging.assertQueue(queueName, channelName)
      this._logger.info(`Queue ${queueName} asserted`)
      await messaging.purgeQueue(queueName, channelName)
      this._logger.info(`Queue ${queueName} purged`)
      while(true) {
        const requestMessage = await messaging.consumeRequestMessageFromQueue(queueName, channelName)
        this._logger.info(`Message ${requestMessage} received from queue ${queueName}`)
        const correlationId = requestMessage.properties.correlationId
        const replyTo = requestMessage.properties.replyTo
        const responseMessage = this.processMessage(requestMessage)
        this._logger.info(`Message ${requestMessage.properties.correlationId} processed to ${responseMessage}`)
        messaging.sendToQueue(replyTo, JSON.stringify(responseMessage), channelName)
        this._logger.info(`Message ${requestMessage.properties.correlationId} sent to queue ${queueName}`)
        if (!requestMessage.properties.deliveryTag) {
          throw new Error('Request message has no deliveryTag to ack')
        }
        messaging.ack(requestMessage.properties.deliveryTag, channelName)
        this._logger.info(`Message ${requestMessage.properties.correlationId} ackowledged`)
      }
    } catch (error) {
      this._logger.error(error as Error)
    }
  }
}

export default Service