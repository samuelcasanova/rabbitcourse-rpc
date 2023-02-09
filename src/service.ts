import { RequestMessage, ResponseMessage } from "./message"
import Messaging from "./messaging"

const channelName = 'service'
const queueName = 'q.rpc'
const exchangeName = 'exchange'

class Service {
  processMessage(request: RequestMessage) : ResponseMessage {
    return { result: request.a + request.b }
  }

  async run() {
    const messaging = new Messaging()
    await messaging.createChannel(channelName)
    await messaging.assertQueue(queueName, channelName)
    while(true) {
      const requestMessage = await messaging.consumeFromQueue<RequestMessage>(queueName, channelName)
      const responseMessage = this.processMessage(requestMessage)
      await messaging.sendToExchange(exchangeName, JSON.stringify(responseMessage), null, channelName)
    }
  }
}