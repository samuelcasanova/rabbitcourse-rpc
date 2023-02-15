import client, {Connection, Channel, ConsumeMessage} from 'amqplib'
import { RequestMessage, ResponseMessage, Message } from './message'
const username = 'guest'
const password = 'guest'
const hostname = 'localhost'
const port = 5672

type Converter = (original: ConsumeMessage) => Message

// based on https://www.cloudamqp.com/blog/how-to-run-rabbitmq-with-nodejs.html
class Messaging {
  private _connection: Connection | null
  private _connectionString: string
  private _channels: Map<string, Channel>

  constructor() {
    this._connection = null
    this._connectionString = `amqp://${username}:${password}@${hostname}:${port}`
    this._channels = new Map<string, Channel>()
  }

  async createChannel(channelName: string, prefetchLimit?: number) {
    if (this._channels.has(channelName)) {
      throw new Error(`Channel with name ${channelName} already exists`)
    }
    if (!this._connection) {
      this._connection = await client.connect(this._connectionString)
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

  sendToQueue<T>(queueName: string, message: T, channelName: string) {
    const channel = this.getChannel(channelName)
    const messageString = JSON.stringify(message)
    channel.sendToQueue(queueName, Buffer.from(messageString))
  }

  async consumeFromQueue(queueName: string, channelName: string) : Promise<Message> {
    const channel = this.getChannel(channelName)
    const message = await new Promise<Message>((resolve, reject) => {
      channel.consume(queueName, (message) => {
        const messageContentString = message?.content.toString()
        const messageContent = JSON.parse(messageContentString || '')
        const { correlationId, replyTo } = message?.properties || {}
        const { deliveryTag } = message?.fields || {}
        if (messageContent.a && messageContent.b) {
          const requestMessage: RequestMessage = {
            a: messageContent.a,
            b: messageContent.b,
            properties: {
              deliveryTag,
              correlationId,
              replyTo
            }
          }
          resolve(requestMessage)
        }
        if (messageContent.result) {
          const responseMessage: ResponseMessage = {
            result: messageContent.result,
            properties: {
              deliveryTag,
              correlationId,
              replyTo
            }
          }
          resolve(responseMessage)
        }
        reject('Unknown message type')
      })
    })
    console.log('Message received: ', message)
    return message
  }

  ack(deliveryTag: number, channelName: string) {
    const channel = this.getChannel(channelName)
    channel.ack({ fields: { deliveryTag }} as client.Message, false)
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



