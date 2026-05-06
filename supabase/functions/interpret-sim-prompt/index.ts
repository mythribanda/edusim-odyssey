const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SIM_SCHEMAS: Record<string, any> = {
  projectile: {
    name: "configure_projectile",
    description: "Configure the slingshot projectile motion simulation parameters.",
    parameters: {
      type: "object",
      properties: {
        power: { type: "number", description: "Launch speed 0-100 m/s" },
        angle: { type: "number", description: "Launch angle 0-90 degrees" },
        gravity: { type: "string", enum: ["Earth", "Moon", "Mars"] },
        launch: { type: "boolean", description: "Auto-launch after applying" },
        explanation: { type: "string", description: "1-2 sentence summary of the change" },
      },
      required: ["explanation"],
      additionalProperties: false,
    },
  },
  first: {
    name: "configure_first_law",
    description: "Configure Newton's First Law (inertia / bus brake) simulation.",
    parameters: {
      type: "object",
      properties: {
        mass: { type: "number", description: "Object mass 1-20 kg" },
        friction: { type: "number", description: "Friction coefficient 0-1" },
        velocity: { type: "number", description: "Initial bus velocity 0-20 m/s" },
        brake: { type: "boolean", description: "Trigger brake action" },
        explanation: { type: "string" },
      },
      required: ["explanation"],
      additionalProperties: false,
    },
  },
  second: {
    name: "configure_second_law",
    description: "Configure Newton's Second Law (F=ma) simulation.",
    parameters: {
      type: "object",
      properties: {
        force: { type: "number", description: "Applied force 0-50 N" },
        mass: { type: "number", description: "Mass 1-20 kg" },
        explanation: { type: "string" },
      },
      required: ["explanation"],
      additionalProperties: false,
    },
  },
  third: {
    name: "configure_third_law",
    description: "Configure Newton's Third Law (action-reaction skaters) simulation.",
    parameters: {
      type: "object",
      properties: {
        thrust: { type: "number", description: "Thrust force 5-50 N" },
        massA: { type: "number", description: "Mass of skater A 1-20 kg" },
        massB: { type: "number", description: "Mass of skater B 1-20 kg" },
        launch: { type: "boolean" },
        explanation: { type: "string" },
      },
      required: ["explanation"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sim, prompt, current } = await req.json();
    const schema = SIM_SCHEMAS[sim];
    if (!schema) {
      return new Response(JSON.stringify({ error: "Unknown sim" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `You are a physics simulation configurator for an educational app called EduSim. The user describes how they want a "${sim}" simulation to look or behave in plain language. Translate their request into concrete numeric parameters by calling the provided tool. Current parameters: ${JSON.stringify(current)}. Only include parameters that should change. Keep values within their stated ranges. Provide a short friendly explanation of what you changed and why physically.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        tools: [{ type: "function", function: schema }],
        tool_choice: { type: "function", function: { name: schema.name } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit hit, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : {};
    return new Response(JSON.stringify({ params: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
