import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeneratedScene {
  sceneNumber: number;
  visualDescription: string;
  motionPrompt: string;
  duration: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { storyText, fileContent, fileName } = await req.json();

    // Parse .docx if provided
    let contentToProcess = storyText || "";
    
    if (fileContent && fileName?.endsWith(".docx")) {
      // For simplicity, we'll use the text content if available
      // A more complete implementation would parse the docx
      contentToProcess = storyText || "Process the uploaded document";
    }

    if (!contentToProcess.trim()) {
      return new Response(JSON.stringify({ error: "No content provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check credits (0.1 for scene generation)
    const { data: profile } = await supabase
      .from("profiles")
      .select("tokens_remaining, is_legacy_user")
      .eq("id", user.id)
      .single();

    if (!profile?.is_legacy_user && (profile?.tokens_remaining || 0) < 0.1) {
      return new Response(JSON.stringify({ 
        error: "Créditos insuficientes",
        creditsRemaining: profile?.tokens_remaining || 0,
        creditsRequired: 0.1,
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Lovable AI to generate scenes
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a professional film storyboard creator. Your task is to analyze a story or script and break it down into individual scenes suitable for video generation.

For each scene, provide:
1. sceneNumber: Sequential number starting from 1
2. visualDescription: A detailed description of what should appear in the image (characters, setting, lighting, mood, camera angle). This will be used to generate AI images.
3. motionPrompt: Instructions for how the scene should move/animate (camera movements, character actions, effects). Keep it concise.
4. duration: Suggested duration in seconds (5-10 seconds per scene)

IMPORTANT GUIDELINES:
- Create between 3-12 scenes depending on story length
- Each scene should be a distinct moment or shot
- Visual descriptions should be detailed enough for AI image generation
- Motion prompts should describe movement and animation
- Keep scenes visually interesting and varied
- Consider pacing and flow between scenes

Respond ONLY with valid JSON in this exact format:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "visualDescription": "A lone figure walks through a misty forest at dawn, golden light filtering through the trees",
      "motionPrompt": "Slow camera dolly following the figure, gentle mist movement",
      "duration": 5
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Break down this story/script into storyboard scenes:\n\n${contentToProcess}` },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error("Failed to generate scenes");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let scenes: GeneratedScene[];
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      const parsed = JSON.parse(jsonStr);
      scenes = parsed.scenes;
      
      if (!Array.isArray(scenes) || scenes.length === 0) {
        throw new Error("Invalid scenes format");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse AI response");
    }

    // Deduct credits if not legacy user
    if (!profile?.is_legacy_user) {
      await supabase
        .from("profiles")
        .update({ tokens_remaining: (profile?.tokens_remaining || 0) - 0.1 })
        .eq("id", user.id);
    }

    // Log usage
    await supabase.from("token_usage").insert({
      user_id: user.id,
      model_name: "gemini-3-flash-preview",
      tokens_used: 1,
      message_content: `Story builder: ${contentToProcess.slice(0, 100)}...`,
      ai_response_content: `Generated ${scenes.length} scenes`,
    });

    console.log(`[generate-storyboard-scenes] Generated ${scenes.length} scenes for user ${user.id}`);

    return new Response(JSON.stringify({ scenes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[generate-storyboard-scenes] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
