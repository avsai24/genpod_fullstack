// src/app/api/codeview/route.ts

import { NextRequest } from 'next/server'
import { createSSEStream } from '@/lib/sse'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

export async function GET(req: NextRequest) {
  const { readable, push, close } = createSSEStream()

  const protoPath = path.resolve(
    process.cwd(),
    'protos/agent.proto' // Make sure this matches your actual location
  )

  const packageDef = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  })

  const proto = grpc.loadPackageDefinition(packageDef) as any
  const client = new proto.agent.AgentService(
    'localhost:50052',
    grpc.credentials.createInsecure()
  )

  const request = { tab: 'codeview', user_id: 'default_user' }

  const call = client.StreamData(request)

  call.on('data', (response: any) => {
    if (response.type === 'codeview') {
      push({ event: 'codeview', data: response.json_payload })
    }
  })

  call.on('end', () => {
    push({ event: 'end', data: 'CodeView stream ended.' })
    close()
  })

  call.on('error', (err: any) => {
    push({ event: 'error', data: JSON.stringify({ error: err.message }) })
    close()
  })

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  })
}