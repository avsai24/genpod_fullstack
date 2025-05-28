export function createSSEStream() {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const push = ({ event, data }: { event: string; data: string }) => {
    const payload = `event: ${event}\ndata: ${data}\n\n`
    writer.write(encoder.encode(payload))
  }

  const close = async () => {
    try {
      await writer.close()
    } catch (err) {
      console.warn("⚠️ SSE writer already closed or errored:", err)
    }
  }

  return {
    readable: stream.readable,
    push,
    close
  }
}