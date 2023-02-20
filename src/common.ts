export async function wait(timeInMillis: number) {
  await new Promise<void>(resolve => {
    setTimeout(() => resolve(), timeInMillis)
  })
}

export async function waitForExistingEventLoopTasks() {
  await new Promise<void>(resolve => {
    setImmediate(() => resolve())
  })
}