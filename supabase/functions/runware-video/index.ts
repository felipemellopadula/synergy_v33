import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RUNWARE_API_KEY = Deno.env.get("RUNWARE_API_KEY");
    if (!RUNWARE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing RUNWARE_API_KEY secret" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }

    const body = await req.json();
    const action = body.action as "start" | "status";
    console.log("[runware-video] Incoming action:", action, { hasPrompt: !!body?.positivePrompt, width: body?.width, height: body?.height, modelId: body?.modelId, taskUUID: body?.taskUUID });

    const API_URL = "https://api.runware.ai/v1";

    if (action === "start") {
      const {
        modelId,
        model,
        positivePrompt,
        width,
        height,
        duration = 6,
        numberResults = 1,
        frameStartUrl,
        frameEndUrl,
        outputFormat = "MP4",
      } = body;

      // Resolve AIR do modelo dinamicamente (suporta nomes amigáveis e AIR direto)
      const resolveModelAIR = async (input?: string): Promise<string> => {
        if (typeof input === 'string' && input.includes(':') && input.includes('@')) return input;
        const guess = (input || '').toLowerCase();
        if (guess.includes('kling')) return 'klingai:5@3';
        if (guess.includes('hailuo') || guess.includes('minimax')) return 'minimax:hailuo@2';
        if (guess.includes('veo')) return 'google:veo-3@fast';
        if (guess.includes('seed') || guess.includes('seedance') || guess.includes('bytedance')) {
          try {
            const msUUID = crypto.randomUUID();
            const searchTasks = [
              { taskType: 'authentication', apiKey: RUNWARE_API_KEY },
              { taskType: 'modelSearch', taskUUID: msUUID, search: input || 'seedance lite', visibility: 'all', limit: 10 },
            ];
            const sr = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(searchTasks) });
            const js = await sr.json();
            const results = js?.data?.[0]?.results || [];
            const pick = results.find((r: any) => String(r.air || '').startsWith('bytedance:')) || results[0];
            if (pick?.air) return pick.air;
          } catch (e) {
            console.error('[runware-video] modelSearch failed:', e);
          }
        }
        return 'klingai:5@3';
      };

      if (!positivePrompt || !width || !height) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const taskUUID = crypto.randomUUID();
      const resolvedModel = await resolveModelAIR(modelId || model);

      const tasks: any[] = [
        { taskType: "authentication", apiKey: RUNWARE_API_KEY },
        {
          taskType: "videoInference",
          taskUUID,
          model: resolvedModel,
          positivePrompt,
          duration,
          width,
          height,
          fps: 24,
          numberResults,
          outputType: "URL",
          outputFormat,
          deliveryMethod: "async",
        },
      ];

      console.log("[runware-video] start -> resolvedModel", resolvedModel);
      console.log("[runware-video] start -> tasks:", tasks);


      const frameImages: any[] = [];
      if (frameStartUrl) frameImages.push({ inputImage: frameStartUrl, frame: "first" });
      if (frameEndUrl) frameImages.push({ inputImage: frameEndUrl, frame: "last" });
      if (frameImages.length > 0) {
        tasks[1].frameImages = frameImages;
      }

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tasks),
      });

      const json = await res.json().catch(async (e) => {
        const text = await res.text().catch(() => "<no body>");
        console.error("[runware-video] start -> JSON parse error:", e, text);
        throw new Error("Invalid JSON from Runware (start)");
      });

      console.log("[runware-video] start -> response:", res.status, json);


      if (!res.ok || json.errors) {
        const message = json.errors?.[0]?.message || json.error || `Runware error (${res.status})`;
        console.error("[runware-video] start -> error:", message, json);
        return new Response(JSON.stringify({ error: message, details: json, status: res.status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }


      return new Response(JSON.stringify({ taskUUID, ack: json.data?.[0] || null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "status") {
      const { taskUUID } = body;
      if (!taskUUID) {
        return new Response(JSON.stringify({ error: "Missing taskUUID" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const tasks = [
        { taskType: "authentication", apiKey: RUNWARE_API_KEY },
        { taskType: "getResponse", taskUUID },
      ];

      console.log("[runware-video] status -> tasks:", tasks);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tasks),
      });
      const json = await res.json().catch(async (e) => {
        const text = await res.text().catch(() => "<no body>");
        console.error("[runware-video] status -> JSON parse error:", e, text);
        throw new Error("Invalid JSON from Runware (status)");
      });

      console.log("[runware-video] status -> response:", res.status, json);

      if (!res.ok || json.errors) {
        const message = json.errors?.[0]?.message || json.error || `Runware error (${res.status})`;
        console.error("[runware-video] status -> error:", message, json);
        return new Response(JSON.stringify({ error: message, details: json, status: res.status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      // Extract first successful video item if present
      const dataItem = Array.isArray(json.data)
        ? json.data.find((d: any) => d.status === "success" && (d.videoURL || d.url)) || json.data[0]
        : null;

      return new Response(JSON.stringify({ raw: json, result: dataItem || null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (err) {
    console.error("runware-video function error:", err);
    const message = (err as Error)?.message || "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
