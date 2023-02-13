import { RequestMessage, ResponseMessage } from './message'
import Messaging from './messaging'
import log from './logging'

const channelName = 'service'
const queueName = 'q.rpc'

class Service {
  processMessage(request: RequestMessage) : ResponseMessage {
    return { result: request.a + request.b }
  }

  async run() {
    try {
      log.info('Running Service')
      const messaging = new Messaging()
      log.info('Messaging initialized')
      await messaging.createChannel(channelName)
      log.info(`Channel ${channelName} created`)
      await messaging.assertQueue(queueName, channelName)
      log.info(`Queue ${queueName} asserted`)
      await messaging.purgeQueue(queueName, channelName)
      log.info(`Queue ${queueName} purged`)
      while(true) {
        const requestMessage = await messaging.consumeFromQueue<RequestMessage>(queueName, channelName)
        log.info(`Message ${requestMessage} received from queue ${queueName} by the Service`)
        const correlationId = requestMessage.properties.correlationId
        const replyTo = requestMessage.properties.replyTo
        const responseMessage = this.processMessage(requestMessage)
        log.info(`Message ${requestMessage.properties.correlationId} processed to ${responseMessage} by the Service`)
        messaging.sendToQueue(replyTo, JSON.stringify(responseMessage), channelName)
        log.info(`Message ${requestMessage.properties.correlationId} sent to queue ${queueName} by the Service`)
        messaging.ack(requestMessage.properties.deliveryTag, channelName)
        log.info(`Message ${requestMessage.properties.correlationId} ackowledged by the Service`)
      }
    } catch (error) {
      log.error(error as Error)
    }
  }
}

export default Service