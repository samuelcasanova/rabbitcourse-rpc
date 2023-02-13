export type RequestMessage = {
  a: number,
  b: number,
  properties: {
    deliveryTag: number
    correlationId: string,
    replyTo: string
  }
}

export type ResponseMessage = {
  result: number
}