export default class Logger {
  _identifier: string

  constructor(identifier: string) {
    this._identifier = identifier
  }
  
  log(message: string) {
    console.log(`${this._identifier}: ${message}`)
  }

  info(message: string) {
    this.log(message)
  }

  error(error: Error) {
    console.error(`${this._identifier}: ${error.message}`, error)
  }
  
  warn(message: string) {
    console.warn(`${this._identifier}: ${message}`)
  }
}