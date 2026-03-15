export async function consumeEnrollmentCredits(params: {
  token: string;
  classId: string;
  childId: string;
  dates: string[];
}) {
  const res = await fetch("/api/enrollments/consume", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      classId: params.classId,
      childId: params.childId,
      dates: params.dates,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "CREDITS_ENROLL_FAILED");
  return data as { remaining?: number };
}

