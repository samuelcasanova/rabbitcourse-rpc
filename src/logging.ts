export function log(message: string, ...args) {
  console.log(message, args)
}

export function info(message: string, ...args) {
  log(message, args)
}

export function error(message: string, ...args) {
  console.error(message, args)
}

export function warn(message: string, ...args) {
  console.warn(message, args)
}
