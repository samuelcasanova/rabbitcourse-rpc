import Consumer from './consumer'

const run = async () => {
  const consumer = new Consumer('1')
  consumer.run(5, 500)
}

run()

