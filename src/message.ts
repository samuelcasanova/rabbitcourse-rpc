export type RequestMessage = {
  a: number,
  b: number,
  properties: {
    correlationId: string,
    replyTo: string
  }
}

export type ResponseMessage = {
  result: number
}