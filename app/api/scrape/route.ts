import { NextRequest, NextResponse } from "next/server";
import Firecrawl from "firecrawl";

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const result = await firecrawl.scrape(url);

    return NextResponse.json({
      title: result.metadata?.title ?? null,
      description: result.metadata?.description ?? null,
      content: result.markdown ?? null,
      links: result.links ?? [],
      metadata: result.metadata ?? {},
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Failed to scrape URL" },
      { status: 500 },
    );
  }
}
