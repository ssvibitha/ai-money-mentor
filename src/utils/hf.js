const HF_TOKEN = process.env.REACT_APP_HF_TOKEN;
const MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

export async function callLLM(prompt) {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${MODEL}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    }
  );

  if (response.status === 503) {
    throw new Error("Model is loading, please wait 20 seconds and try again.");
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No response from model");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  return JSON.parse(jsonMatch[0]);
}