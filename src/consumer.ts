import { RequestMessage, ResponseMessage } from "./message"
import Messaging from "./messaging"
import { v4 as uuidv4 } from 'uuid'
import Logger from './logging'
import { wait } from "./common"

const channelName = 'consumer'
const rpcQueueName = 'q.rpc'

class Consumer {
  private _messaging: Messaging
  private _logger: Logger

  constructor(messaging: Messaging, logger: Logger) {
    this._messaging = messaging
    this._logger = logger
  }

  async run(calls: number, timeBetweenCallsInMillis: number) {
    try {
      const exclusiveQueueName = await this.initQueue()
      for (let i = 0; i < calls; i++) {
        const requestMessage = this.createRequestMessage(
          Math.round(Math.random() * 100),
          Math.round(Math.random() * 100),
          exclusiveQueueName
        )
        this.sendRequest(requestMessage)
        const responseMessage = await this.consumeResponse(exclusiveQueueName)
        this.ackResponse(responseMessage)
        await wait(timeBetweenCallsInMillis)
      }
    } catch (error) {
      this._logger.error(error as Error)
    }
  }

  public async initQueue() {
    await this._messaging.createChannel(channelName)
    this._logger.info(`Channel ${channelName} created`)
    const exclusiveQueueName = await this._messaging.createNewExclusiveQueue(channelName)
    this._logger.info(`Queue ${exclusiveQueueName} asserted`)
    return exclusiveQueueName
  }

  public ackResponse(responseMessage: ResponseMessage) {
    this._messaging.ack(responseMessage, channelName)
    this._logger.info(`Response message with correlationId ${responseMessage.properties.correlationId} acknowledged`)
  }

  public async consumeResponse(exclusiveQueueName: string) {
    const responseMessage = await this._messaging.consumeResponseMessageFromQueue(exclusiveQueueName, channelName)
    this._logger.info(`Response message consumed from queue ${exclusiveQueueName}`, responseMessage)
    return responseMessage
  }

  public sendRequest(requestMessage: RequestMessage) {
    this._messaging.sendToQueue(rpcQueueName, requestMessage, channelName)
    this._logger.info(`Request message sent to queue ${rpcQueueName}`, requestMessage)
  }

  public createRequestMessage(a: number, b: number, replyToQueue: string) {
    const correlationId = uuidv4()
    const requestMessage: RequestMessage = {
      a,
      b,
      properties: {
        correlationId,
        replyTo: replyToQueue
      }
    }
    return requestMessage
  }
}

export default Consumer