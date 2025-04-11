export async function GET() {
    return Response.json({
      logs: [
        '[Agent] Starting plan generation...',
        '[Chain] Retrieved relevant context from VectorDB.',
        '[Planner] Creating substeps for "model deployment"...',
        '[Executor] Generated code for step 1: setup.py',
        '[Agent] Completed Phase 1 successfully',
      ],
    })
  }