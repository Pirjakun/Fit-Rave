import { getEventInfo, REGISTRATION_DEADLINE } from "@/features/event/data";
import { ApiAuthError, requireUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const eventInfo = await getEventInfo();
    return Response.json({
      ...eventInfo,
      registrationDeadline: REGISTRATION_DEADLINE.toISOString(),
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
