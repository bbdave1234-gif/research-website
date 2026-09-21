import { NextResponse } from "next/server";
import { getPapers } from "@/lib/blob-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const papers = await getPapers();
  return NextResponse.json({ papers, count: papers.length });
}
