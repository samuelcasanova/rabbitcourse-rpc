import { wait } from './common'
import Consumer from './consumer'
import Service from './service'

const run = async () => {
  const service = new Service()
  service.run()
  
  const consumer = new Consumer('1')
  consumer.run(5, 500)
}

run()

