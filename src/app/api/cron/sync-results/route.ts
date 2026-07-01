import { runCronSync } from "@/lib/cron/sync";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const headerSecret = request.headers.get("x-cron-secret");
  return headerSecret === cronSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runCronSync();
  return Response.json(result);
}

export async function POST(request: Request) {
  return GET(request);
}
