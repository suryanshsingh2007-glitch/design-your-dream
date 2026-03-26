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
    const { room_type, objects, budget, style, image_base64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a professional interior designer and space planning expert.
Analyze the given interior image and generate practical, budget-aware design recommendations.

### CONTEXT:
- Room type: ${room_type}
- Detected objects: ${objects || "Not specified"}
- User budget: ₹${budget}
- Preferred style: ${style}

### TASK:
Provide complete interior design guidance.

### REQUIREMENTS:
1. Suggest a suitable color palette (with HEX codes).
2. Recommend furniture items (with estimated prices in INR).
3. Suggest exact placement of furniture (spatial arrangement).
4. Optimize everything within the given budget.
5. Keep suggestions realistic and purchasable in India.
6. Prioritize space efficiency and aesthetics.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (image_base64) {
      messages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${image_base64}` },
          },
          {
            type: "text",
            text: `Analyze this ${room_type} image and provide design recommendations in the specified JSON format. Budget: ₹${budget}, Style: ${style}.`,
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: `Provide design recommendations for a ${room_type} in ${style} style with a budget of ₹${budget}. Return the response in the specified JSON format.`,
      });
    }

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
          messages,
          tools: [
            {
              type: "function",
              function: {
                name: "interior_design_recommendations",
                description:
                  "Return interior design recommendations as structured data",
                parameters: {
                  type: "object",
                  properties: {
                    room_type: { type: "string" },
                    color_palette: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          color: { type: "string" },
                          hex: { type: "string" },
                        },
                        required: ["color", "hex"],
                      },
                    },
                    furniture: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          item: { type: "string" },
                          estimated_price: { type: "string" },
                          placement: { type: "string" },
                          reason: { type: "string" },
                        },
                        required: [
                          "item",
                          "estimated_price",
                          "placement",
                          "reason",
                        ],
                      },
                    },
                    layout_tips: {
                      type: "array",
                      items: { type: "string" },
                    },
                    budget_summary: {
                      type: "object",
                      properties: {
                        total_estimated_cost: { type: "string" },
                        budget_status: {
                          type: "string",
                          enum: ["within", "exceeded"],
                        },
                        savings_tips: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: [
                        "total_estimated_cost",
                        "budget_status",
                        "savings_tips",
                      ],
                    },
                  },
                  required: [
                    "room_type",
                    "color_palette",
                    "furniture",
                    "layout_tips",
                    "budget_summary",
                  ],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "interior_design_recommendations" },
          },
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
