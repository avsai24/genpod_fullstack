// src/app/api/chat/stream/route.ts
import { NextRequest } from 'next/server'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

const PROTO_PATH = path.resolve(process.cwd(), 'protos/agent.proto')

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const grpcObj = grpc.loadPackageDefinition(packageDef) as any
const ChatService = grpcObj.agent.ChatService // ✅ Correct path

const client = new ChatService(
  'localhost:50052',
  grpc.credentials.createInsecure()
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const message = searchParams.get('message') || ''

  const stream = new ReadableStream({
    start(controller) {
      const call = client.SendMessageStream({ user: 'user1', message })

      call.on('data', (chunk: any) => {
        const payload = JSON.stringify({ reply: chunk.reply })
        controller.enqueue(`data: ${payload}\n\n`)
      })

      call.on('end', () => controller.close())
      call.on('error', (err: any) => {
        console.error('gRPC error:', err)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}