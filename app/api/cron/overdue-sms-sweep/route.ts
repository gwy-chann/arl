import {
  isAuthorizedCronRequest,
  executeOverdueSmsSweep,
  type CronRouteResponse,
} from '../../../../lib/services/sms-cron-service.ts';

async function handleCronSweep(request: Request): Promise<Response> {
  const authHeader = request.headers.get('authorization');

  if (!isAuthorizedCronRequest(authHeader)) {
    return Response.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Unauthorized: Invalid or missing bearer token',
      } satisfies CronRouteResponse,
      { status: 401 }
    );
  }

  try {
    const summary = await executeOverdueSmsSweep();
    return Response.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        summary,
      } satisfies CronRouteResponse,
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[api/cron/overdue-sms-sweep] Sweep error:', error);
    return Response.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: errorMessage,
      } satisfies CronRouteResponse,
      { status: 500 }
    );
  }
}

export async function GET(request: Request): Promise<Response> {
  return handleCronSweep(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCronSweep(request);
}
