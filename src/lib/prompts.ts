// ── Person 2 prompts: Logo analysis, generation, improvement, style description ──

export function ANALYZE_LOGO_PROMPT(industry: string, location: string) {
  return `You are an expert marketing designer and brand strategist.

Analyze the provided logo for a ${industry} business located in ${location}.
Also consider the competitor logos provided for comparison.

Rate the logo on a scale of 1-10 overall, and provide per-format ratings for:
- **Banner**: How effective is this logo when placed on horizontal marketing banners?
- **Video**: How well does this logo work in motion/video ad contexts? (clarity at small sizes, simplicity for animation)
- **Social**: How recognizable and effective is this logo as a social media profile picture or post graphic?

For each rating, provide specific marketing reasoning — not generic praise.

Also provide concrete improvement suggestions ranked by priority (high, medium, low). Each suggestion should include:
- What to change
- Why it matters from a marketing perspective

Finally, compare against the competitor logos:
- Note any color palette overlaps that could cause brand confusion
- Suggest how to differentiate visually

Respond ONLY with valid JSON matching this exact schema:
{
  "overallRating": <number 1-10>,
  "formatRatings": {
    "banner": { "score": <number 1-10>, "reasoning": "<string>" },
    "video": { "score": <number 1-10>, "reasoning": "<string>" },
    "social": { "score": <number 1-10>, "reasoning": "<string>" }
  },
  "improvements": [
    {
      "suggestion": "<string>",
      "marketingReason": "<string>",
      "priority": "high" | "medium" | "low"
    }
  ],
  "competitorAnalysis": {
    "colorOverlap": "<string>",
    "differentiation": "<string>"
  }
}`;
}

export function GENERATE_LOGO_PROMPT(
  industry: string,
  location: string,
  competitorAnalysis: string,
  brandDescription?: string
) {
  const brandLine = brandDescription
    ? `The brand is described as: "${brandDescription}".`
    : "";

  return `Create a professional, modern logo for a ${industry} business located in ${location}.
${brandLine}

Design requirements:
- Clean, simple, and memorable
- Works well at small sizes (social media icons) and large sizes (banners)
- Uses a distinctive color palette that stands apart from competitors
- Professional and trustworthy feel appropriate for the ${industry} industry

Competitor context — avoid these visual choices:
${competitorAnalysis || "No competitor data available."}

Generate a single, polished logo on a clean white background. No text in the image unless it is integral to the logo mark. The logo should be iconic and vector-style.`;
}

export function IMPROVE_LOGO_PROMPT(
  improvement: string,
  styleDescription?: string
) {
  const styleLine = styleDescription
    ? `Maintain the existing visual style: ${styleDescription}.`
    : "";

  return `You are a professional logo designer. Improve the provided logo by applying this specific change:

"${improvement}"

${styleLine}

Keep the overall brand identity recognizable — this should feel like a refined version of the same logo, not a completely new design. Apply only the requested improvement while preserving everything else about the logo's character.

Output the improved logo on a clean white background.`;
}

export function DESCRIBE_STYLE_PROMPT() {
  return `Describe this logo's visual style in a concise phrase (10-15 words max).
Focus on: design style (minimalist, geometric, hand-drawn, etc.), color temperature (warm, cool, neutral), and overall mood (playful, professional, bold, elegant, etc.).

Example outputs:
- "Minimalist geometric mark with warm earth tones, professional and approachable"
- "Bold sans-serif wordmark in cool blues, modern and authoritative"
- "Hand-drawn organic logo with muted pastels, friendly and artisanal"

Respond with ONLY the style description string, nothing else.`;
}
