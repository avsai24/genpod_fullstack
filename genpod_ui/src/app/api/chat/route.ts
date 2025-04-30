// src/app/api/chat/route.ts
import { NextRequest } from 'next/server'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

const PROTO_PATH = path.resolve(process.cwd(), 'protos/chat.proto')

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any
const ChatService = grpcObject.chat.ChatService

const client = new ChatService(
  'localhost:50051',
  grpc.credentials.createInsecure()
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { message } = body

  return new Promise((resolve) => {
    client.SendMessage({ user: 'user1', message }, (err: any, response: any) => {
      if (err) {
        console.error('gRPC Error:', err)
        return resolve(
          new Response(JSON.stringify({ error: err.message }), { status: 500 })
        )
      }

      return resolve(
        new Response(JSON.stringify({ reply: response.reply }), {
          status: 200,
        })
      )
    })
  })
}