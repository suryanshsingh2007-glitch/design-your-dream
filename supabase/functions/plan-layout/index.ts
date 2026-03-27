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
    const { room_type, objects, dimensions, persona, climate, city } = await req.json();

    if (!room_type) {
      return new Response(
        JSON.stringify({ error: "room_type is required" }),
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

    const systemPrompt = `You are a space planning expert specializing in residential interiors.

Given:
- Room type: ${room_type}
- Objects/furniture: ${objects || "standard furniture for this room type"}
- Room dimensions: ${dimensions || "standard size"}
${profileLine ? `- Profile: ${profileLine}` : ""}

Task: Suggest optimal furniture placement.

Rules:
- Maintain minimum 90cm (3ft) walking paths between furniture
- Follow ergonomic principles (TV viewing distance, desk height clearance, bed access from both sides, etc.)
- Keep it practical for real Indian homes (often compact spaces)
- Consider door swing clearance and window access
- Ensure natural traffic flow through the room
- Position relative to walls, corners, windows, and doors
- Consider ${climate || "local"} climate for ventilation and airflow needs`;

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
              content: `Create a placement plan for a ${room_type} with these items: ${objects || "typical furniture"}. Dimensions: ${dimensions || "standard"}.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "placement_plan",
                description: "Return an optimal furniture placement plan with ergonomic reasoning",
                parameters: {
                  type: "object",
                  properties: {
                    placement_plan: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          item: { type: "string", description: "Furniture item name" },
                          position: { type: "string", description: "Where to place (e.g. against north wall, center of room)" },
                          direction: { type: "string", description: "Facing direction or orientation" },
                          distance_from_other_items: { type: "string", description: "Spacing from nearby furniture" },
                          reason: { type: "string", description: "Ergonomic or practical reason for this placement" },
                        },
                        required: ["item", "position", "direction", "distance_from_other_items", "reason"],
                      },
                    },
                  },
                  required: ["placement_plan"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "placement_plan" } },
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
