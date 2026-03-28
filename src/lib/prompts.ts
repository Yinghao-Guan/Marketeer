export const GENERATE_PROPOSAL_PROMPT = (
    brandName: string,
    industry: string,
    location: string,
    colors: string[],
    style: string,
    competitorAnalysis: string,
    logoDescription: string,
    revisionFeedback?: string
) => `
Act as a world-class creative director. Create a marketing campaign brief for:

Brand Name: ${brandName}
Industry: ${industry}
Location: ${location}
Visual Style: ${style}
Color Palette: ${colors.join(', ')}
Logo Description: ${logoDescription}
Competitor Analysis: ${competitorAnalysis}
${revisionFeedback ? `Revision Feedback: ${revisionFeedback}` : ''}

Output a strict JSON object with these fields:
1. tagline: A punchy slogan under 10 words.
2. bannerConcept: One sentence describing the visual composition for posters.
3. jingleMood: Description of music genre, energy, and tempo.
4. videoScene: A 5-8 second scene description including camera angles, lighting, and action.
5. voiceoverScript: The exact words for the video narration.
6. voiceTone: The specific tone for the voiceover (e.g., warm, bold, energetic, calm).

Ensure the content is visually distinct from competitors and adheres to the color palette.
`;

export const BANNER_PROMPT = (
    brandName: string,
    bannerConcept: string,
    colors: string[],
    style: string
) => `
Professional marketing banner for "${brandName}".
Concept: ${bannerConcept}
Style: ${style}
Colors: Use ${colors.join(', ')} prominently.
High-quality commercial photography style, clean composition, optimized for social media.
`;

export const VIDEO_SCENE_PROMPT = (
    videoScene: string,
    colors: string[],
    style: string
) => `
Cinematic video shot: ${videoScene}.
Visual Style: ${style}.
Color Grade: Emphasize ${colors.join(', ')}.
Technical: 4K textures, smooth camera movement, professional lighting, photorealistic.
`;

export const VOICEOVER_PROMPT = (
    script: string,
    voiceTone: string
) => `
Narrate this script with a ${voiceTone} tone:
"${script}"
Professional commercial quality, clear articulation, natural pacing.
`;

export const JINGLE_PROMPT = (
    brandName: string,
    tagline: string,
    jingleMood: string,
    industry: string
) => `
30-second branded jingle for "${brandName}".
Tagline: "${tagline}"
Mood and Style: ${jingleMood}
Industry Context: ${industry}
Include original lyrics inspired by the brand and a catchy melody.
`;