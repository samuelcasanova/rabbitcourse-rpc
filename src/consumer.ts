import { RequestMessage, ResponseMessage } from "./message"
import Messaging from "./messaging"
import { v4 as uuidv4 } from 'uuid'
import Logger from './logging'

const channelName = 'consumer'
const rpcQueueName = 'q.rpc'

class Consumer {
  _name: string
  _logger: Logger

  constructor(name: string) {
    this._name = name
    this._logger = new Logger(`Consumer ${name}`)
  }

  async run() {
    try {
      this._logger.info('Running')
      const messaging = new Messaging()
      await messaging.createChannel(channelName)
      this._logger.info(`Channel ${channelName} created`)
      const exclusiveQueueName = await messaging.createNewExclusiveQueue(channelName)
      this._logger.info(`Queue ${exclusiveQueueName} asserted`)
      const correlationId = uuidv4()
      const requestMessage: RequestMessage = {
        a: Math.round(Math.random() * 100),
        b: Math.round(Math.random() * 100),
        properties: {
          correlationId,
          replyTo: exclusiveQueueName
        }
      }
      messaging.sendToQueue(rpcQueueName, requestMessage, channelName)
      this._logger.info(`Message with correlationId ${correlationId} sent to queue ${rpcQueueName}`)
      const responseMessage = await messaging.consumeResponseMessageFromQueue(exclusiveQueueName, channelName)
      if (!responseMessage.properties.deliveryTag) {
        throw new Error(`Response message with correlationId ${correlationId} has no deliveryTag to ack`)
      }
      messaging.ack(responseMessage.properties.deliveryTag, channelName)
      this._logger.info(`Response message with correlationId ${correlationId} has the result ${responseMessage.result}`)
    } catch (error) {
      this._logger.error(error as Error)
    }
  }
}

export default Consumer