import { RequestMessage, ResponseMessage } from './message'
import Messaging from './messaging'
import { info } from './logging'

const channelName = 'service'
const queueName = 'q.rpc'
const exchangeName = 'exchange'

class Service {
  processMessage(request: RequestMessage) : ResponseMessage {
    return { result: request.a + request.b }
  }

  async run() {
    info('Running Service')
    const messaging = new Messaging()
    info('Messaging initialized')
    await messaging.createChannel(channelName)
    info(`Channel ${channelName} created`)
    await messaging.assertQueue(queueName, channelName)
    info(`Queue ${queueName} asserted`)
    await messaging.purgeQueue(queueName, channelName)
    info(`Queue ${queueName} purged`)
    while(true) {
      const requestMessage = await messaging.consumeFromQueue<RequestMessage>(queueName, channelName)
      const correlationId = requestMessage.properties.correlationId
      const replyTo = requestMessage.properties.replyTo
      info(`Message ${JSON.stringify(requestMessage)} received from queue ${queueName} by the Service`)
      const responseMessage = this.processMessage(requestMessage)
      info(`Message ${JSON.stringify(requestMessage)} processed to ${responseMessage} by the Service`)
      await messaging.sendToQueue(replyTo, JSON.stringify(responseMessage), channelName)
      info(`Message ${JSON.stringify(responseMessage)} sent to exchange ${exchangeName} by the Service`)
    }
  }
}