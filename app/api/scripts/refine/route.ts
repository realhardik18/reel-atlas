import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { script, prompt } = await req.json();
  if (!script || !prompt) {
    return Response.json({ error: "Script and prompt are required" }, { status: 400 });
  }

  // Fetch brand image for context
  const { data: brandImage } = await getSupabaseAdmin()
    .from("brand_images")
    .select("full_brand_image")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const bi = brandImage?.full_brand_image;

  const result = streamText({
    model: openrouter("google/gemini-2.5-flash"),
    prompt: `You are a UGC video script editor. You have an existing script and a refinement request. Rewrite the script based on the request while keeping the same overall format and structure.

${bi ? `BRAND CONTEXT:
Brand: ${bi.brand_name}
Voice: ${bi.brand_voice}
Target Audience: ${bi.target_audience}
Content Style: ${bi.content_style}
` : ""}
CURRENT SCRIPT:
${script}

REFINEMENT REQUEST:
${prompt}

RULES:
- Output ONLY the revised script in markdown format
- Keep the same markdown structure (# title, **bold** scene directions, timing cues, dialogue)
- Start with a markdown heading: # Script Title
- Apply the refinement request thoughtfully
- Keep it between 20-30 seconds when spoken aloud
- Do NOT add explanations, commentary, or wrap in code blocks
- Do NOT prefix with "Here is..." or similar preamble — just output the script`,
  });

  return result.toTextStreamResponse();
}
