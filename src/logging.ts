export function log(message: string, ...args: any[]) {
  if (args?.length) {
    console.log(message, args)
  } else {
    console.log(message)
  }
}

export function info(message: string, ...args: any[]) {
  log(message, args?.length ? args : null)
}

export function error(error: Error, ...args: any[]) {
  if (args?.length) {
    console.error(error, args?.length ? args : null)
  } else {
    console.error(error)
  }
}

export function warn(message: string, ...args: any[]) {
  if (args?.length) {
    console.warn(message, args?.length ? args : null)
  } else {
    console.warn(message)
  }
}

export default { log, error, info, warn }