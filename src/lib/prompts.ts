export const GENERATE_PROPOSAL_PROMPT = (
    brandName: string,
    industry: string,
    location: string,
    colors: string[],
    style: string,
    competitorAnalysis: string,
    logoDescription: string,
    description: string,
    revisionFeedback?: string
) => `
Act as a world-class creative director. Create a marketing campaign brief for:

Brand Name: ${brandName}
Business Description: ${description}
Industry: ${industry}
Location: ${location}
Visual Style: ${style}
Color Palette: ${colors.join(', ')}
Logo Description: ${logoDescription}
Competitor Analysis: ${competitorAnalysis}
${revisionFeedback ? `Revision Feedback: ${revisionFeedback}` : ''}

CRITICAL: The business is described as "${description}". All campaign content MUST reflect what this business actually does. Do not guess or infer a different type of business.

IMPORTANT — Location matters. The business is in ${location}. Incorporate this into every asset:
- bannerConcept: Reference the local environment, architecture, or cultural elements of ${location} in the visual composition.
- jingleMood: Consider regional music styles or energy that resonates with audiences in ${location}.
- videoScene: Set the scene in a setting authentic to ${location} — use local landmarks, landscapes, or typical environments.
- voiceoverScript: Write copy that speaks naturally to customers in ${location}.

Output a strict JSON object with these fields:
1. tagline: A punchy slogan under 10 words.
2. bannerConcept: One sentence describing the visual composition for posters, incorporating ${location} context.
3. jingleMood: Description of music genre, energy, and tempo suited to the ${location} market.
4. videoScene: A 5-8 second scene description including camera angles, lighting, and action set in ${location}.
5. voiceoverScript: The exact words for the video narration, written for a ${location} audience.
6. voiceTone: The specific tone for the voiceover (e.g., warm, bold, energetic, calm).

Ensure the content is visually distinct from competitors and adheres to the color palette.
`;

export const BANNER_PROMPT = (
    brandName: string,
    bannerConcept: string,
    colors: string[],
    style: string,
    location: string,
    description: string
) => `
Professional marketing banner for "${brandName}", a business located in ${location}.
Business: ${description}
Concept: ${bannerConcept}
Style: ${style}
Colors: Use ${colors.join(', ')} prominently.
The visual should feel authentic to ${location} and clearly represent a business that ${description}.
High-quality commercial photography style, clean composition, optimized for social media.
`;

export const VIDEO_SCENE_PROMPT = (
    videoScene: string,
    colors: string[],
    style: string,
    location: string,
    description: string
) => `
Cinematic video shot of a product or environment set in ${location} for a business that ${description} (no people, no faces): ${videoScene}.
Visual Style: ${style}.
Color Grade: Emphasize ${colors.join(', ')}.
The setting should reflect ${location} and the business's identity.
Technical: 4K textures, smooth camera movement, professional lighting, photorealistic.
Focus on objects, interiors, exteriors, and close-up product shots. No humans or text overlays.
`;

export const VOICEOVER_PROMPT = (
    script: string,
    voiceTone: string,
    location: string,
    description: string
) => `
Narrate this script with a ${voiceTone} tone for a ${description} business in ${location}:
"${script}"
Professional commercial quality, clear articulation, natural pacing. Deliver it in a way that feels authentic and relatable to a ${location} audience.
`;

export const JINGLE_PROMPT = (
    brandName: string,
    tagline: string,
    jingleMood: string,
    industry: string,
    location: string,
    description: string
) => `
30-second branded jingle for "${brandName}", a ${industry} business in ${location} that ${description}.
Tagline: "${tagline}"
Mood and Style: ${jingleMood}
The music should resonate with the ${location} market — consider regional flavor or energy that fits the area.
Include original lyrics inspired by the brand and a catchy melody.
`;

// ── Person 2 prompts: Logo analysis, generation, improvement, style description ──

export function ANALYZE_LOGO_PROMPT(industry: string, location: string) {
  return `You are an expert marketing designer and brand strategist.

IMPORTANT: The FIRST image provided is the USER'S LOGO — this is the ONLY logo you are rating and suggesting improvements for. Any additional images are COMPETITOR logos for comparison only. Do NOT suggest changes that would make the user's logo look more like a competitor. Do NOT reference competitor brand names or elements in your improvement suggestions.

Analyze the USER'S LOGO (the first image) for a ${industry} business located in ${location}.

Rate this logo on a scale of 1-10 overall, and provide per-format ratings for:
- **Banner**: How effective is this logo when placed on horizontal marketing banners?
- **Video**: How well does this logo work in motion/video ad contexts? (clarity at small sizes, simplicity for animation)
- **Social**: How recognizable and effective is this logo as a social media profile picture or post graphic?

For each rating, provide specific marketing reasoning — not generic praise.

IMPROVEMENT SUGGESTIONS — follow these rules strictly based on the overall rating:

**If overall rating is 9.0 or above:** Do NOT suggest any improvements. Return an empty improvements array []. The logo is excellent as-is.

**If overall rating is 7.0–8.9:** Only suggest minor fine-tuning. Focus on:
- Refining edges and small details for crisp rendering
- Ensuring the logo works well in video/motion contexts at various sizes
- Return at most 1-2 low-priority suggestions

**If overall rating is 5.0–6.9:** Suggest a few targeted improvements:
- Evaluate the color palette — does it work well for the ${industry} industry? Recommend specific color adjustments if needed
- Compare against competitor logos and ensure the user's logo has a clear differentiating factor (color, style, or shape)
- Return 2-3 suggestions, mix of medium and low priority

**If overall rating is below 5.0:** Provide comprehensive improvement suggestions:
- All of the above (colors, competitor differentiation)
- Research ${industry} industry best practices for logos and suggest alignment
- If the logo is overly complex, suggest simplification for better recognition at small sizes
- Return 3-4 suggestions, including high priority ones

Each suggestion should:
- Describe what to change about the user's logo specifically
- Explain why it matters from a marketing perspective
- NOT suggest adding elements from competitor logos

Compare the user's logo against the competitor logos:
- Note any color palette overlaps that could cause brand confusion
- Suggest how the user can differentiate visually from competitors

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

  return `You are a professional logo designer. The image provided is the user's current logo. Improve it by applying this specific change:

"${improvement}"

${styleLine}

IMPORTANT RULES:
- Only modify the user's logo shown in the image — do NOT add elements from any other brand
- Keep the overall brand identity recognizable — this should feel like a refined version of the same logo, not a completely new design
- Apply only the requested improvement while preserving everything else about the logo's character
- Do NOT add text, names, or elements from competitor brands

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
