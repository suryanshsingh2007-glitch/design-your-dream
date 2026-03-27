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
    const { room_type, style, budget, lighting, size, persona, climate, city } = await req.json();

    if (!room_type || !style) {
      return new Response(
        JSON.stringify({ error: "room_type and style are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const profileLine = [
      persona ? `User: ${persona}` : "",
      climate ? `Climate: ${climate}` : "",
      city ? `City: ${city}` : "",
    ].filter(Boolean).join(", ");

    const systemPrompt = `You are a color psychology and interior design expert.
Suggest a color palette for a ${room_type} with ${style} style.

Constraints:
- Budget: ₹${budget || "flexible"}
- Lighting condition: ${lighting || "natural light"}
- Room size: ${size || "medium"}
${profileLine ? `- Profile: ${profileLine}` : ""}

Requirements:
- Provide exactly 5 colors with HEX codes
- Explain the psychological reason each color is chosen (mood, energy, spaciousness, etc.)
- Suggest where to apply each color (walls, ceiling, furniture, accents, decor)
- Consider the lighting condition when choosing tones (darker rooms need lighter/warmer tones)
- Consider room size (small rooms benefit from lighter palettes, large rooms can handle bolder colors)
- Consider climate (cool tones for hot climates, warm tones for cold climates)
- Keep paint/material costs realistic for the Indian market within the given budget`;

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
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Suggest a 5-color palette for a ${room_type} in ${style} style. Lighting: ${lighting || "natural"}, Size: ${size || "medium"}, Budget: ₹${budget || "flexible"}.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "color_palette_suggestion",
                description: "Return a curated color palette with psychology-based reasoning",
                parameters: {
                  type: "object",
                  properties: {
                    palette: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          color: { type: "string", description: "Color name" },
                          hex: { type: "string", description: "HEX code" },
                          usage: { type: "string", description: "Where to apply this color (walls, furniture, decor, etc.)" },
                          reason: { type: "string", description: "Psychology/design reason for choosing this color" },
                        },
                        required: ["color", "hex", "usage", "reason"],
                      },
                    },
                  },
                  required: ["palette"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "color_palette_suggestion" } },
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
