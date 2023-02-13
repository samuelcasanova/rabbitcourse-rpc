import client, {Connection, Channel, Message, ConsumeMessage} from 'amqplib'
const username = 'guest'
const password = 'guest'
const hostname = 'localhost'
const port = 5672

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
    
  async createChannel(channelName: string) {
    if (this._channels.has(channelName)) {
      throw new Error(`Channel with name ${channelName} already exists`)
    }
    if (!this._connection) {
      this._connection = await client.connect(this._connectionString)
    }
    const channel = await this._connection.createChannel()
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

  async consumeFromQueue<T>(queueName: string, channelName: string) : Promise<T> {
    const channel = this.getChannel(channelName)
    const message = await new Promise((resolve) => {
      channel.consume(queueName, (message) => {
        const messageString = message?.content.toString()
        const { a, b } = JSON.parse(messageString || '')
        const { correlationId, replyTo } = message?.properties || {}
        const { deliveryTag } = message?.fields || {}
        const requestMessage = {
          a, 
          b, 
          properties: {
            deliveryTag,
            correlationId,
            replyTo
          }
        }
        resolve(requestMessage)
      })
    })
    console.log('Message received: ', message)
    return message as T
  }

  ack(deliveryTag: number, channelName: string) {
    const channel = this.getChannel(channelName)
    channel.ack({ fields: { deliveryTag }} as Message, false)
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



