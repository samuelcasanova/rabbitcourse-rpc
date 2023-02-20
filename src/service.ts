import { RequestMessage, ResponseMessage } from './message'
import Messaging from './messaging'
import Logger from './logging'
import { wait } from './common'

const channelName = 'service'
const queueName = 'q.rpc'

class Service {
  private _logger: Logger
  private _messaging: Messaging
  
  constructor(messaging: Messaging, logger: Logger) {
    this._messaging = messaging
    this._logger = logger
  }

  async run() {
    try {
      await this.init()
      while(true) {
        const requestMessage = await this.consumeMessage()
        const responseMessage = this.processMessage(requestMessage)
        this.sendResponse(requestMessage, responseMessage)
        this.ackRequest(requestMessage)
      }
    } catch (error) {
      this._logger.error(error as Error)
    }
  }
  
  private async init() {
    await this._messaging.createChannel(channelName, 1)
    this._logger.info(`Channel ${channelName} created`)
    await this._messaging.assertQueue(queueName, channelName)
    this._logger.info(`Queue ${queueName} asserted`)
  }

  private async consumeMessage() {
    const requestMessage = await this._messaging.consumeRequestMessageFromQueue(queueName, channelName)
    this._logger.info(`Message received from queue ${queueName}:`, requestMessage)
    return requestMessage
  }

  private processMessage(request: RequestMessage) : ResponseMessage {
    const responseMessage = { 
      result: request.a + request.b,
      properties: {
        correlationId: request.properties.correlationId
      }  
    }  
    this._logger.info(`Response message created and ready to be sent back`, responseMessage)
    return responseMessage
  }  

  private sendResponse(requestMessage: RequestMessage, responseMessage: ResponseMessage) {
    const { replyTo } = requestMessage.properties
    if (!replyTo) {
      throw new Error('replyTo is undefined in the requestMessage, so theres no way to send a response message back')
    }  
    this._messaging.sendToQueue(replyTo, responseMessage, channelName)
    this._logger.info(`Response message sent to queue ${replyTo}`)
  }  
  
  private ackRequest(requestMessage: RequestMessage) {
    this._messaging.ack(requestMessage, channelName)
    this._logger.info(`Request message ${requestMessage.properties.correlationId} ackowledged`)
  }
}    

export default Service