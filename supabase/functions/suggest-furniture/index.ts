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
    const { room_type, style, budget } = await req.json();

    if (!room_type || !style || !budget) {
      return new Response(
        JSON.stringify({ error: "room_type, style, and budget are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an interior designer specializing in budget optimization for the Indian market.

Suggest furniture for:
- Room: ${room_type}
- Style: ${style}
- Budget: ₹${budget}

Rules:
- Use realistic Indian market prices (from brands like IKEA India, Pepperfry, Urban Ladder, local carpenter rates)
- Prioritize essential items first (high priority), then comfort items (medium), then decorative (low)
- The total of high-priority items MUST fit within the budget
- For each item, suggest 1-2 cheaper alternatives
- Include placement guidance for each item
- Price ranges should be realistic INR values`;

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
              content: `Suggest furniture for a ${room_type} in ${style} style with a budget of ₹${budget}. Prioritize essentials and include alternatives.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "furniture_suggestions",
                description: "Return budget-optimized furniture suggestions with priorities and alternatives",
                parameters: {
                  type: "object",
                  properties: {
                    furniture: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          item: { type: "string", description: "Furniture item name" },
                          price_range: { type: "string", description: "Price range in INR e.g. ₹5,000–₹8,000" },
                          priority: { type: "string", enum: ["high", "medium", "low"], description: "Priority level" },
                          placement: { type: "string", description: "Where to place in the room" },
                          alternatives: {
                            type: "array",
                            items: { type: "string" },
                            description: "1-2 cheaper alternative options",
                          },
                        },
                        required: ["item", "price_range", "priority", "placement", "alternatives"],
                      },
                    },
                  },
                  required: ["furniture"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "furniture_suggestions" } },
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
