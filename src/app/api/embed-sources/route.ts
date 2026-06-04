import { loadEmbedSourceConfigs } from "@/lib/embedSourcesServer";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(loadEmbedSourceConfigs());
}
