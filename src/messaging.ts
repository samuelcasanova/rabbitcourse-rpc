import client, {Connection, Channel } from 'amqplib'
import { RequestMessage, ResponseMessage, Message } from './message'
import { wait } from './common'
const username = 'guest'
const password = 'guest'
const hostname = 'localhost'
const port = 5672

// based on https://www.cloudamqp.com/blog/how-to-run-rabbitmq-with-nodejs.html
class Messaging {
  private _connection?: Connection
  private _connectionString: string
  private _channels: Map<string, Channel>
  private _isConnecting: boolean
  private _requestResolver?: (message: RequestMessage) => void
  private _requestConsumerRegistered: boolean
  private _responseResolver?: (message: ResponseMessage) => void
  private _responseConsumerRegistered: boolean

  constructor() {
    this._connectionString = `amqp://${username}:${password}@${hostname}:${port}`
    this._channels = new Map<string, Channel>()
    this._isConnecting = false
    this._requestConsumerRegistered = false
    this._responseConsumerRegistered = false
  }

  async createChannel(channelName: string, prefetchLimit?: number) {
    if (this._channels.has(channelName)) {
      throw new Error(`Channel with name ${channelName} already exists`)
    }
    while(!this._connection && this._isConnecting) {
      await wait(1)
    }
    if (!this._connection) {
      this._isConnecting = true
      this._connection = await client.connect(this._connectionString)
      this._isConnecting = false
    }
    const channel = await this._connection.createChannel()
    if (prefetchLimit) {
      channel.prefetch(prefetchLimit)
    }
    this._channels.set(channelName, channel)
  }

  async assertQueue(queueName: string, channelName: string) {
    await this.assertQueueImpl(queueName, channelName)
  }

  async createNewExclusiveQueue(channelName: string): Promise<string> {
    return await this.assertQueueImpl('', channelName, true)
  }

  private async assertQueueImpl(queueName: string, channelName: string, exclusive: boolean = false): Promise<string> {
    const channel = this.getChannel(channelName)
    const assertQueueResponse = await channel.assertQueue(queueName, { exclusive })
    return assertQueueResponse.queue
  }

  async purgeQueue(queueName: string, channelName: string) {
    const channel = this.getChannel(channelName)
    await channel.purgeQueue(queueName)
  }

  sendToQueue(queueName: string, message: Message, channelName: string) {
    const channel = this.getChannel(channelName)
    const messageString = JSON.stringify(message)
    const { correlationId, replyTo } = message.properties
    const options = {
      ...( correlationId ? { correlationId } : {}),
      ...( replyTo ? { replyTo } : {})
    }
    channel.sendToQueue(queueName, Buffer.from(messageString), options)
  }

  async consumeRequestMessageFromQueue(queueName: string, channelName: string) : Promise<RequestMessage> {
    if (!this._requestConsumerRegistered) {
      const channel = this.getChannel(channelName)
      channel.consume(queueName, (message) => {
        if (!message) {
          throw new Error('request message is undefined')
        }
        const messageContentString = message.content.toString()
        const { a, b } = JSON.parse(messageContentString || '')
        const { correlationId, replyTo } = message.properties || {}
        const { deliveryTag } = message.fields || {}
        const requestMessage: RequestMessage = {
          a, 
          b, 
          properties: {
            deliveryTag,
            correlationId,
            replyTo
          }
        }
        if (this._requestResolver) {
          this._requestResolver(requestMessage)
        } else {
          throw new Error('Received a request message but no consumer resolver was registered')
        }
      }, { noAck: false })
      this._requestConsumerRegistered = true
    }

    const message = await new Promise<RequestMessage>(resolve => {
      this._requestResolver = resolve
    })
    return message
  }

  async consumeResponseMessageFromQueue(queueName: string, channelName: string) : Promise<ResponseMessage> {
    if (!this._responseConsumerRegistered) {
      const channel = this.getChannel(channelName)
      channel.consume(queueName, (message) => {
        if (!message) {
          throw new Error('response message is undefined')
        } 
        const messageContentString = message?.content.toString()
        const { result } = JSON.parse(messageContentString || '')
        const { correlationId } = message?.properties || {}
        const { deliveryTag } = message?.fields || {}
        const responseMessage: ResponseMessage = {
          result,
          properties: {
            deliveryTag,
            correlationId
          }
        }
        if (this._responseResolver) {
          this._responseResolver(responseMessage)
        } else {
          throw new Error('Received a response message but no consumer resolver was registered')
        }
        this._responseConsumerRegistered = true
      }, { noAck: false })
    }

    const message = await new Promise<ResponseMessage>(resolve => {
      this._responseResolver = resolve
    })
    return message
  }

  ack(message: Message, channelName: string) {
    if (!message?.properties?.deliveryTag) {
      throw new Error(`Message ${JSON.stringify(message)} has no deliveryTag to perform the ack`)
    }
    const channel = this.getChannel(channelName)
    channel.ack({ fields: { deliveryTag: message.properties.deliveryTag }} as client.Message, false)
  }

  async closeAll() {
    await wait(50)
    for (const channelEntry of this._channels.entries()) {
      const [_, channel] = channelEntry
      await channel.close()
    }
    await this._connection?.close()
  }

  private getChannel(channelName: string) : Channel {
    const channel = this._channels.get(channelName)
    if (!channel) {
      throw new Error(`Channel ${channelName} not found`)
    }
    return channel
  }
}

export default Messaging



