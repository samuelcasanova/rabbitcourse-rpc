import client, {Connection, Channel, Message} from 'amqplib'
const username = 'guest'
const password = 'guest'
const hostname = 'localhost'
const port = 5672

// based on https://www.cloudamqp.com/blog/how-to-run-rabbitmq-with-nodejs.html
class Messaging {
  private _connection: Connection
  private _connectionString: string
  private _channels: Map<string, Channel>

  constructor() {
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
    const channel = this.getChannel(channelName)
    await channel.assertQueue(queueName)
  }

  async sendToExchange(exchangeName: string, message: string, routingKey: string, channelName: string) {
    const channel = this.getChannel(channelName)
    await channel.publish(exchangeName, routingKey, Buffer.from(message))
  }

  async sendToQueue(queueName: string, message: string, channelName: string) {
    const channel = this.getChannel(channelName)
    await channel.sendToQueue(queueName, Buffer.from(message))
  }

  async consumeFromQueue<T>(queueName: string, channelName: string) : Promise<T> {
    const channel = this.getChannel(channelName)
    const message = await new Promise((resolve) => {
      channel.consume(queueName, (message) => {
        resolve(message)
      })
    })
    return message ? JSON.parse(message as string) : null
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



