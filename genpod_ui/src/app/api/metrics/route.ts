export async function GET() {
    return Response.json({
      modelProgress: 99,
      tokensUsed: 12450,
      estimatedTimeRemaining: '2m 15s',
    })
  }