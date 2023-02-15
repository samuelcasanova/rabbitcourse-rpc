import Consumer from './consumer'
import Service from './service'

const service = new Service()
service.run()
const consumer = new Consumer('1')
consumer.run()

