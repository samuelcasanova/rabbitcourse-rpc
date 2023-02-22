import Consumer from './consumer'
import Logger from './logging'
import Messaging from './messaging'
import Service from './service'

const run = async () => {
  const messaging = new Messaging()
  const service = new Service(messaging, new Logger('Service'))
  service.run()
  
  const consumer = new Consumer(messaging, new Logger('Consumer'))
  consumer.run(5, 500)
}

run()

