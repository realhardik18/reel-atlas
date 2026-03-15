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

  const body = await req.json().catch(() => ({}));
  const count = Math.min(4, Math.max(1, Number(body.count) || 3));
  const notes = (body.notes || "").trim();

  // Fetch user's latest brand image
  const { data: brandImage } = await getSupabaseAdmin()
    .from("brand_images")
    .select("full_brand_image")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!brandImage?.full_brand_image) {
    return Response.json(
      { error: "No brand image found. Complete onboarding first." },
      { status: 400 },
    );
  }

  const bi = brandImage.full_brand_image;

  const notesSection = notes
    ? `\nADDITIONAL NOTES FROM THE USER:\n${notes}\nIncorporate these notes into the scripts where relevant.\n`
    : "";

  const result = streamText({
    model: openrouter("google/gemini-2.5-flash"),
    prompt: `You are an expert UGC (User Generated Content) video script writer who creates highly detailed, production-ready scripts. Based on the following brand profile, generate exactly ${count} unique UGC video script${count !== 1 ? "s" : ""}.

BRAND PROFILE:
Brand: ${bi.brand_name}
Voice: ${bi.brand_voice}
Target Audience: ${bi.target_audience}
Content Style: ${bi.content_style}
Content Themes: ${bi.content_themes?.join(", ")}
UGC Suggestions: ${bi.ugc_suggestions?.join(", ")}
Target Markets: ${bi.target_markets?.join(", ")}
${notesSection}
SCRIPT REQUIREMENTS:
- Each script should be 25-40 seconds when spoken aloud
- Each must be a DIFFERENT format (mix from: testimonial, tutorial/how-to, day-in-the-life, unboxing, get-ready-with-me, before/after, storytime, POV, problem-solution, comparison)
- Make them feel raw, authentic, and native to the platform — not polished or corporate

DETAILED FORMAT FOR EACH SCRIPT:
1. Start with: # [Catchy Script Title]
2. Below the title, add a short italic line: *Format: [type] | Duration: [Xs] | Platform: [TikTok/Reels/Shorts]*
3. Use ## for section breaks within the script
4. Use **bold** for all visual/scene directions and camera notes
5. Use regular text for spoken dialogue (write it exactly as it would be said, conversationally)
6. Use > blockquotes for on-screen text overlays or captions
7. Include precise timing cues like [0:00-0:05] for each beat
8. Add a --- separator before a final section called ## Production Notes with 2-3 bullet points about filming tips, mood, and pacing

CRITICAL FORMAT RULES:
- Separate each script with exactly this delimiter on its own line: ===SCRIPT_BREAK===
- Do NOT put ===SCRIPT_BREAK=== before the first script or after the last script
- Do NOT wrap scripts in code blocks, JSON, or any container
- Output raw markdown only`,
  });

  return result.toTextStreamResponse();
}
