export type Message = {
  properties: {
    deliveryTag?: number,
    correlationId: string,
    replyTo?: string
  }
}

export type RequestMessage = Message & {
  a: number,
  b: number
}

export type ResponseMessage = Message & {
  result: number
}