import { seedMaterials } from "@/services/seed-materials";

export async function GET() {
  try {
    const result = await seedMaterials();
    return Response.json({
      success: true,
      message: `Added ${result.count} mock materials`,
      count: result.count,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
