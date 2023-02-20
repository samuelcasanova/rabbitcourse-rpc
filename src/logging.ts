export default class Logger {
  _identifier: string

  constructor(identifier: string) {
    this._identifier = identifier
  }
  
  log(message: string, ...args: any[]) {
    if (args?.length) {
      console.log(`${this._identifier}: ${message}`, args)
    } else {
      console.log(`${this._identifier}: ${message}`)
    }
  }

  info(message: string, ...args: any[]) {
    this.log(message, ...args)
  }

  error(error: Error) {
    console.error(`${this._identifier}: ${error.message}`, error)
  }
  
  warn(message: string, ...args: any[]) {
    if(args?.length) {
      console.warn(`${this._identifier}: ${message}`, args)
    } else {
      console.warn(`${this._identifier}: ${message}`)
    }
  }
}