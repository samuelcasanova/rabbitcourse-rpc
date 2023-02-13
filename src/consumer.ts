import logging from "./logging"
import { RequestMessage, ResponseMessage } from "./message"
import Messaging from "./messaging"
import { v4 as uuidv4 } from 'uuid'

const channelName = 'consumer'
const rpcQueueName = 'q.rpc'

class Consumer {
  async run() {
    const messaging = new Messaging()
    messaging.createChannel(channelName)
    const exclusiveQueueName = await messaging.createNewExclusiveQueue(channelName)
    const correlationId = uuidv4()
    const requestMessage: RequestMessage = {
      a: Math.round(Math.random() * 100),
      b: Math.round(Math.random() * 100),
      properties: {
        deliveryTag: 0,
        correlationId,
        replyTo: exclusiveQueueName
      }
    }
    messaging.sendToQueue(rpcQueueName, requestMessage, channelName)
    const responseMessage = await messaging.consumeFromQueue<ResponseMessage>(exclusiveQueueName, channelName)
    logging.info(`Response result is ${responseMessage.result}`)
  }
}

export default Consumer