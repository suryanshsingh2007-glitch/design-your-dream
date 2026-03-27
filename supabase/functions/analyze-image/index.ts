import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { image_base64 } = await req.json();
    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an expert interior design analyst. Carefully analyze the room image and identify everything visible. Be thorough and specific about furniture positions, style assessment, and any design problems you spot (clutter, poor lighting, bad spacing, color clashes, etc.).`,
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:image/jpeg;base64,${image_base64}` },
                },
                {
                  type: "text",
                  text: "Analyze this interior image. Identify the room type, all visible objects/furniture, describe the layout, assess the current style, and list any design problems.",
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "room_analysis",
                description: "Return structured analysis of a room image",
                parameters: {
                  type: "object",
                  properties: {
                    room_type: {
                      type: "string",
                      description: "Type of room (e.g. bedroom, living room, kitchen)",
                    },
                    objects: {
                      type: "array",
                      items: { type: "string" },
                      description: "All visible furniture and objects",
                    },
                    layout_description: {
                      type: "string",
                      description: "Spatial description of how items are arranged",
                    },
                    current_style: {
                      type: "string",
                      description: "Design style assessment (modern, traditional, minimal, etc.)",
                    },
                    problems: {
                      type: "array",
                      items: { type: "string" },
                      description: "Design issues like clutter, poor lighting, bad spacing",
                    },
                  },
                  required: ["room_type", "objects", "layout_description", "current_style", "problems"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "room_analysis" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
