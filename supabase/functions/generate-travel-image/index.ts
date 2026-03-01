/**
 * ============================================================
 *  TRAVEL SOCIAL MEDIA IMAGE GENERATOR — Supabase Edge Function
 *  Model: google/gemini-2.5-flash-preview-05-20
 *  Route: POST /functions/v1/generate-image
 * ============================================================
 *
 *  Designed for: Travelers · Bloggers · Travel Agents
 *  Purpose: Generate stunning, platform-optimised social media
 *           images from rich travel-specific structured inputs.
 *
 *  Required secret:  OPENROUTER_API_KEY
 *  Optional secret:  ALLOWED_ORIGINS  (comma-separated, default *)
 *                    SITE_URL         (your app domain for HTTP-Referer)
 * ============================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ── Model ────────────────────────────────────────────────────
const MODEL = "google/gemini-2.5-flash-preview-05-20";

// ── Environment ──────────────────────────────────────────────
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "*")
  .split(",")
  .map((s) => s.trim());

// ── CORS ─────────────────────────────────────────────────────
function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const allow =
    ALLOWED_ORIGINS.includes("*") ||
    (requestOrigin !== null && ALLOWED_ORIGINS.includes(requestOrigin))
      ? (requestOrigin ?? "*")
      : (ALLOWED_ORIGINS[0] ?? "*");

  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

// ─────────────────────────────────────────────────────────────
//  TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────

/**
 * The four high-level intent categories a user can choose from.
 * Directly maps to the travel content taxonomy.
 */
type TravelCategory =
  | "aspirational"   // Scenic landscapes, dream destinations, wanderlust
  | "emotional"      // People, food, culture, authentic experiences
  | "practical"      // Logistics, comfort, relaxation moments
  | "promotional";   // Infographics, banners, marketing imagery

type PhotographyStyle =
  | "photorealistic"
  | "cinematic_lighting"
  | "candid_shot"
  | "documentary_style"
  | "aerial_view"
  | "drone_shot"
  | "wide_angle"
  | "close_up"
  | "macro_photography"
  | "fisheye_lens"
  | "low_light"
  | "backlit"
  | "hdr"
  | "watercolor_illustration"
  | "vector_art"
  | "minimalist_design"
  | "vintage_travel_poster"
  | "cartoon_style";

type Mood =
  | "vibrant"
  | "serene"
  | "adventurous"
  | "romantic"
  | "luxurious"
  | "cozy"
  | "festive"
  | "dreamy"
  | "energetic";

type ColorPalette =
  | "warm_tones"
  | "cool_tones"
  | "pastel_palette"
  | "monochromatic"
  | "colorful"
  | "earthy_hues";

type Composition =
  | "rule_of_thirds"
  | "leading_lines"
  | "depth_of_field"
  | "bokeh_effect"
  | "symmetrical"
  | "asymmetrical_balance";

type SocialFormat =
  | "instagram_feed"     // 1:1
  | "instagram_story"    // 9:16
  | "instagram_reel"     // 9:16
  | "pinterest_pin"      // 2:3
  | "facebook_post"      // 16:9
  | "twitter_post"       // 16:9
  | "linkedin_post"      // 16:9
  | "youtube_thumbnail"; // 16:9

type ImageQuality = "standard" | "high" | "ultra";

type CreatorType = "traveler" | "blogger" | "travel_agent" | "brand";

// ── Platform → Aspect Ratio map ──────────────────────────────
const FORMAT_ASPECT_RATIO: Record<SocialFormat, string> = {
  instagram_feed:    "1:1",
  instagram_story:   "9:16",
  instagram_reel:    "9:16",
  pinterest_pin:     "2:3",
  facebook_post:     "16:9",
  twitter_post:      "16:9",
  linkedin_post:     "16:9",
  youtube_thumbnail: "16:9",
};

// ── Quality → OpenRouter image_size map ──────────────────────
const QUALITY_MAP: Record<ImageQuality, string> = {
  standard: "1K",
  high:     "2K",
  ultra:    "4K",
};

// ─────────────────────────────────────────────────────────────
//  REQUEST BODY INTERFACE
// ─────────────────────────────────────────────────────────────
interface TravelImageRequest {
  // ── Core (required) ──────────────────────────────────────
  /** Free-text description of the desired image */
  prompt: string;

  // ── Travel Classification ─────────────────────────────────
  /** High-level intent category */
  category?: TravelCategory;

  /** Destination name, e.g. "Santorini, Greece" */
  destination?: string;

  /** Specific landmark, e.g. "Eiffel Tower at dusk" */
  landmark?: string;

  /**
   * Creator persona — shapes tone & styling
   * traveler     → authentic, personal storytelling
   * blogger      → editorial, aspirational
   * travel_agent → professional, promotional
   * brand        → polished, marketing-grade
   */
  creator_type?: CreatorType;

  // ── Style & Composition ───────────────────────────────────
  photography_style?: PhotographyStyle;
  mood?: Mood;
  color_palette?: ColorPalette;
  composition?: Composition;

  // ── People & Subjects ─────────────────────────────────────
  /** e.g. "happy couple", "solo female traveler", "family with young kids" */
  subjects?: string;

  // ── Experience & Activity ─────────────────────────────────
  /** e.g. "snorkeling in crystal clear water", "hiking through jungle at sunrise" */
  activity?: string;

  // ── Food & Culture ────────────────────────────────────────
  /** e.g. "traditional Thai street food", "vibrant local market", "cultural festival" */
  food_culture?: string;

  // ── Text Overlays ─────────────────────────────────────────
  /** Short text to render on the image, e.g. "#Wanderlust" or "Book Now" */
  overlay_text?: string;

  /** Visual treatment for the overlay */
  overlay_style?: "subtle_caption" | "bold_banner" | "minimal_tag" | "none";

  // ── Promotional / Infographic ─────────────────────────────
  /** e.g. "Summer Sale — 30% Off All Packages" */
  promotional_message?: string;

  /** e.g. "travel route map", "travel deals collage", "countdown to vacation" */
  infographic_type?: string;

  // ── Platform & Output ─────────────────────────────────────
  /** Target social media platform — auto-selects aspect ratio */
  social_format?: SocialFormat;

  /** Image quality / resolution tier */
  image_quality?: ImageQuality;

  /** Manual aspect ratio override (takes precedence over social_format) */
  aspect_ratio?: string;

  // ── Reference Images ─────────────────────────────────────
  /** base64 data URLs or HTTPS URLs — max 4, used for image-to-image */
  reference_images?: string[];

  // ── Extra context ─────────────────────────────────────────
  additional_context?: string;
}

// ─────────────────────────────────────────────────────────────
//  SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are an elite travel photography director and social media visual strategist, specialising in
creating high-impact, platform-optimised images for Travelers, Bloggers, and Travel Agents.

## YOUR ROLE
Generate visually stunning, emotionally resonant travel images that:
- Inspire genuine wanderlust and desire to explore
- Are perfectly composed and cropped for the specified social media platform
- Authentically and respectfully represent destinations, people, and cultures
- Match the creator's persona — from personal storytelling to professional marketing

## VISUAL EXCELLENCE STANDARDS
Every image must achieve:
- Magazine-quality or award-winning travel photography aesthetics
- Technically correct and intentional composition
- Lighting that elevates the scene: golden hour, blue hour, dramatic natural or soft ambient light
- Rich, purposeful colour grading aligned with the requested mood and palette
- Cultural authenticity in costumes, environments, food presentation, and cultural symbols

## CATEGORY GUIDELINES

### ASPIRATIONAL — Dream & Wonder
Goal: Breathtaking panoramas, iconic landmarks at their most dramatic, pristine natural beauty.
Lighting: Golden hour, blue hour, dramatic clouds, star-filled skies, first light at dawn.
Feel: Awe-inspiring, larger-than-life, deeply share-worthy.
Examples: "Majestic Santorini caldera at sunset", "Snow-capped Himalayas reflecting in a glacial lake at dawn".

### EMOTIONAL — Connection & Feeling
Goal: Genuine human moments, authentic cultural encounters, joyful and relatable expressions.
Lighting: Soft, warm, natural — flattering and intimate.
Feel: Heartwarming, relatable, authentic, diverse.
Examples: "Friends laughing over street food in Bangkok", "Solo traveler gazing in wonder at the Northern Lights".

### PRACTICAL — Information & Comfort
Goal: Travel logistics shown beautifully, comfort and ease of the journey, preparation and curation.
Lighting: Clean, bright, inviting, aspirational-practical.
Feel: Reassuring, trustworthy, still aspirational.
Examples: "Luxurious airplane business class interior", "Minimalist well-packed travel essentials flat lay on linen".

### PROMOTIONAL — Marketing & Business
Goal: Polished branded visuals, clear messaging hierarchy, professional layouts with strong CTAs.
Lighting: Clean, commercial-grade, high contrast.
Feel: Professional, compelling, action-driving, trustworthy.
Examples: "Summer travel deals collage with destination highlights", "Maldives package promotional banner".

## PLATFORM COMPOSITION INTELLIGENCE
- instagram_feed (1:1): Bold centred or rule-of-thirds, high visual impact, everything readable at thumbnail
- instagram_story / instagram_reel (9:16): Strong vertical flow, subject naturally in upper two-thirds, action or text-safe zone below
- pinterest_pin (2:3): Rich vertical composition, layered detail, text-safe lower zone for titles
- facebook_post / twitter_post / linkedin_post / youtube_thumbnail (16:9): Wide establishing shot, strong horizon, bold focal point readable at small display sizes

## PHOTOGRAPHY & STYLE EXECUTION
Apply requested styles with precision and craft:
- photorealistic: Indistinguishable from a real photograph — accurate lens physics, real-world lighting
- cinematic_lighting: Dramatic film-like colour grading, motivated key and fill light, cinematic aspect feel
- aerial_view / drone_shot: True bird's-eye perspective revealing geography and scale
- vintage_travel_poster: Retro illustrated style — bold flat colour blocking, limited palette, graphic appeal
- watercolor_illustration: Soft translucent painted edges, visible brushwork, artistic interpretation
- bokeh_effect: Tack-sharp subject, creamy smooth background with natural circular bokeh
- hdr: Extended tonal range, brilliant detail preserved in both deep shadows and bright highlights
- low_light: Beautiful ambient illumination, visible grain acceptable, mood-forward

## MOOD & ATMOSPHERE EXECUTION
- vibrant: Saturated, energetic, full of life and movement
- serene: Quiet, still, meditative — muted saturation, open sky or water
- adventurous: Bold, daring, dynamic angles — sense of motion and discovery
- romantic: Warm golden light, soft edges, intimate framing
- luxurious: Refined materials, polished surfaces, architectural elegance
- cozy: Intimate scale, warm tungsten light, textures of wool, wood, firelight
- festive: Colourful, crowded, joyful — lights, decorations, celebration energy
- dreamy: Soft haze, slightly desaturated highlights, ethereal and otherworldly
- energetic: Motion blur, dynamic composition, high shutter-speed frozen action

## CULTURAL SENSITIVITY & GUARDRAILS

### ALWAYS
- Represent destinations, peoples, and cultures with dignity, nuance, and authenticity
- Use diverse, inclusive, and realistic representation of travelers and local communities
- Ensure culturally accurate attire, customs, food, and architectural context
- Apply flattering, even lighting across all skin tones
- Portray locals as hosts and participants in their culture, not props or exotic backgrounds

### NEVER GENERATE
- Stereotypical, demeaning, or reductive portrayals of any ethnicity, nationality, or culture
- Caricatures, exaggerated features, or mockery of cultural dress or traditions
- Misleading imagery that misrepresents a destination's safety, appearance, or character
- Sexualised or exploitative imagery of any person, adult or minor
- Violent, disturbing, graphic, or gore-adjacent imagery of any kind
- Content that could incite discrimination, hatred, or fear of any group
- Children in any vulnerable or inappropriate context
- Logos, registered trademarks, or copyrighted branding of real organisations
- Text overlays containing false claims, hate speech, slurs, or discriminatory language
- Any content that violates the privacy, dignity, or consent of real individuals or communities
- Political propaganda or content intended to mislead or manipulate
- Anything unsuitable for a general professional travel industry audience

## TEXT OVERLAY EXECUTION
When text is requested, integrate it as a professional graphic designer would:
- subtle_caption: Small, elegant, semi-transparent lowercase typography — typically bottom-left corner, no more than two lines
- bold_banner: High-contrast full-width or partial banner strip — clear CTA font, high legibility at small sizes
- minimal_tag: Short phrase or hashtag integrated organically — styled to complement the image colours
- none: Pure visual, no text whatsoever

## OUTPUT STANDARD
Every image delivered must be gallery-worthy — visually arresting within 0.3 seconds of scrolling,
emotionally compelling, technically flawless, and worthy of genuine organic engagement on social media.
`.trim();

// ─────────────────────────────────────────────────────────────
//  PROMPT BUILDER
// ─────────────────────────────────────────────────────────────
function buildEnrichedPrompt(req: TravelImageRequest): string {
  const parts: string[] = [];

  // ── Category framing ──────────────────────────────────────
  const categoryFraming: Record<TravelCategory, string> = {
    aspirational: "ASPIRATIONAL — breathtaking, awe-inspiring, wanderlust-evoking travel imagery",
    emotional:    "EMOTIONAL — genuine human connection, authentic cultural moment, heartfelt travel experience",
    practical:    "PRACTICAL — beautiful and aspirational travel logistics, comfort, or preparation imagery",
    promotional:  "PROMOTIONAL — polished professional travel marketing visual with clear message and visual hierarchy",
  };
  if (req.category) {
    parts.push(`[INTENT] ${categoryFraming[req.category]}`);
  }

  // ── Creator persona ───────────────────────────────────────
  const creatorVoice: Record<CreatorType, string> = {
    traveler:     "authentic personal travel photography — raw, genuine, storytelling-first",
    blogger:      "editorial travel blog visual — aspirational, curated, narrative-driven",
    travel_agent: "professional travel industry promotional quality — polished, trustworthy, aspirational",
    brand:        "high-end travel brand marketing visual — premium, refined, on-brand",
  };
  if (req.creator_type) {
    parts.push(`[CREATOR VOICE] ${creatorVoice[req.creator_type]}`);
  }

  // ── Core scene description ────────────────────────────────
  parts.push(`[SCENE] ${req.prompt}`);

  // ── Destination & Landmark ────────────────────────────────
  if (req.destination) {
    parts.push(`[DESTINATION] ${req.destination} — rendered with geographic and architectural accuracy`);
  }
  if (req.landmark) {
    parts.push(`[LANDMARK] ${req.landmark} — depicted authentically with correct scale and cultural context`);
  }

  // ── Subjects / People ─────────────────────────────────────
  if (req.subjects) {
    parts.push(
      `[SUBJECTS] ${req.subjects} — genuine expressions, natural unposed body language, ` +
      `authentic interaction, diverse and inclusive representation`
    );
  }

  // ── Activity / Experience ─────────────────────────────────
  if (req.activity) {
    parts.push(
      `[ACTIVITY] ${req.activity} — captured dynamically with a visually stunning travel backdrop, ` +
      `conveying authentic lived experience`
    );
  }

  // ── Food & Culture ────────────────────────────────────────
  if (req.food_culture) {
    parts.push(
      `[FOOD & CULTURE] ${req.food_culture} — vibrant, appetising, and culturally authentic ` +
      `presentation with appropriate styling and context`
    );
  }

  // ── Photography / Artistic Style ─────────────────────────
  const styleDescriptions: Record<PhotographyStyle, string> = {
    photorealistic:       "hyper-photorealistic — indistinguishable from a real photograph, accurate optics and physics",
    cinematic_lighting:   "cinematic film-like lighting — dramatic motivated light sources, rich colour grading, anamorphic feel",
    candid_shot:          "candid documentary photography — unposed, spontaneous, real-moment capture",
    documentary_style:    "documentary travel photography — raw, unfiltered, authentic reportage aesthetic",
    aerial_view:          "overhead aerial perspective — true bird's-eye view revealing geography, patterns, and scale",
    drone_shot:           "professional drone photography — elevated angle showing grand landscape scale and context",
    wide_angle:           "wide-angle lens perspective — expansive environment, exaggerated foreground depth",
    close_up:             "intimate close-up shot — subject fills frame, texture and fine detail revealed",
    macro_photography:    "extreme macro — extraordinary detail, small subjects rendered at large scale",
    fisheye_lens:         "fisheye lens — spherical wide-angle distortion, immersive wraparound perspective",
    low_light:            "low-light photography — beautiful ambient illumination, natural grain, mood-forward atmosphere",
    backlit:              "backlit photography — glowing rim light around subject, potential for beautiful silhouette or halo",
    hdr:                  "high dynamic range — brilliant shadow detail and highlight preservation across full tonal range",
    watercolor_illustration: "artistic watercolor illustration — translucent layered washes, soft painted edges, visible brushwork",
    vector_art:           "clean vector graphic art — bold flat colours, crisp geometric shapes, graphic design aesthetic",
    minimalist_design:    "minimalist aesthetic — generous negative space, restrained palette, clean deliberate lines",
    vintage_travel_poster: "vintage retro travel poster style — bold flat colour blocking, limited palette, graphic illustrated appeal",
    cartoon_style:        "stylised cartoon illustration — clean confident outlines, vibrant palette, playful character",
  };
  if (req.photography_style) {
    parts.push(`[PHOTOGRAPHY STYLE] ${styleDescriptions[req.photography_style]}`);
  }

  // ── Mood / Atmosphere ─────────────────────────────────────
  const moodDescriptions: Record<Mood, string> = {
    vibrant:     "vibrant and energetic atmosphere — saturated colours, full of life, motion, and visual excitement",
    serene:      "serene and peaceful atmosphere — calm, still, meditative, open horizon, soft natural light",
    adventurous: "adventurous spirit — bold, daring, dynamic angles, sense of exploration and discovery",
    romantic:    "romantic and intimate — warm golden light, soft edges, close framing, tender emotional resonance",
    luxurious:   "luxury and opulence — refined surfaces, aspirational lifestyle, premium editorial quality",
    cozy:        "cosy and warm — intimate scale, soft tungsten light, tactile textures, inviting and sheltered",
    festive:     "festive and celebratory — colourful, joyful, filled with lights, decorations, and people celebrating",
    dreamy:      "dreamy and ethereal — soft haze, slightly desaturated highlights, magical and otherworldly quality",
    energetic:   "high energy and dynamic — motion, excitement, life — fast-paced and alive",
  };
  if (req.mood) {
    parts.push(`[MOOD & ATMOSPHERE] ${moodDescriptions[req.mood]}`);
  }

  // ── Colour Palette ────────────────────────────────────────
  const colourDescriptions: Record<ColorPalette, string> = {
    warm_tones:     "warm colour palette — golden ambers, burnt terracottas, rich oranges, honey yellows",
    cool_tones:     "cool colour palette — crisp ocean blues, grey teals, silver and slate tones",
    pastel_palette: "soft pastel palette — gentle blush pinks, lavender, mint greens, sky blue",
    monochromatic:  "monochromatic treatment — single dominant hue with rich tonal and saturation variation",
    colorful:       "boldly colourful — full rich spectrum of saturated tones, celebratory visual energy",
    earthy_hues:    "earthy natural hues — warm ochre, burnt sienna, forest green, desert sandstone, clay",
  };
  if (req.color_palette) {
    parts.push(`[COLOUR PALETTE] ${colourDescriptions[req.color_palette]}`);
  }

  // ── Composition ───────────────────────────────────────────
  const compositionDescriptions: Record<Composition, string> = {
    rule_of_thirds:      "rule of thirds — key subject positioned precisely at intersecting grid points for dynamic balance",
    leading_lines:       "strong leading lines — roads, rivers, paths, architecture drawing the eye toward the main subject",
    depth_of_field:      "intentional depth of field — clear foreground, mid-ground, and background separation creating dimension",
    bokeh_effect:        "beautiful bokeh — tack-sharp subject against creamy, naturally blurred background circles",
    symmetrical:         "perfect symmetry — reflective or mirrored balance, architecture or nature as mirror",
    asymmetrical_balance: "dynamic asymmetrical balance — visual weight distributed thoughtfully across the frame",
  };
  if (req.composition) {
    parts.push(`[COMPOSITION] ${compositionDescriptions[req.composition]}`);
  }

  // ── Social Platform ───────────────────────────────────────
  const platformContext: Record<SocialFormat, string> = {
    instagram_feed:    "optimised for Instagram Feed — 1:1 square, bold centred visual hook, readable at thumbnail size",
    instagram_story:   "optimised for Instagram Stories — 9:16 vertical, subject in upper frame, lower area text-safe",
    instagram_reel:    "optimised for Instagram Reels thumbnail — 9:16 vertical, dynamic and immediately eye-catching",
    pinterest_pin:     "optimised for Pinterest Pin — 2:3 tall vertical, rich layered detail, text-safe lower third",
    facebook_post:     "optimised for Facebook Post — 16:9 landscape, clear subject hierarchy, readable at small display size",
    twitter_post:      "optimised for Twitter/X Post — 16:9 landscape, bold and immediately legible at feed size",
    linkedin_post:     "optimised for LinkedIn Post — 16:9 landscape, professional, polished, high credibility",
    youtube_thumbnail: "optimised for YouTube Thumbnail — 16:9 landscape, extreme contrast, readable title-safe zones",
  };
  if (req.social_format) {
    parts.push(`[SOCIAL PLATFORM FORMAT] ${platformContext[req.social_format]}`);
  }

  // ── Text Overlay ──────────────────────────────────────────
  if (req.overlay_text && req.overlay_style && req.overlay_style !== "none") {
    const overlayInstructions: Record<string, string> = {
      subtle_caption: `subtle caption text overlay: "${req.overlay_text}" — small, elegant, semi-transparent typography, bottom-left or bottom-centre, maximum two lines`,
      bold_banner:    `bold banner overlay: "${req.overlay_text}" — high-contrast full-width or partial banner strip, strong legible sans-serif typography, clear and readable at any size`,
      minimal_tag:    `minimal text tag: "${req.overlay_text}" — short phrase or hashtag integrated organically and stylishly, colour-matched to the image palette`,
    };
    const inst = overlayInstructions[req.overlay_style];
    if (inst) parts.push(`[TEXT OVERLAY] ${inst}`);
  }

  // ── Promotional Message ───────────────────────────────────
  if (req.promotional_message) {
    parts.push(
      `[PROMOTIONAL MESSAGE] Integrate a professional call-to-action: "${req.promotional_message}" ` +
      `— clear typographic hierarchy, visual weight balanced with the photographic element`
    );
  }

  // ── Infographic ───────────────────────────────────────────
  if (req.infographic_type) {
    parts.push(
      `[INFOGRAPHIC ELEMENT] ${req.infographic_type} — clean, informative, and visually engaging ` +
      `infographic component integrated naturally into the overall composition`
    );
  }

  // ── Image Quality Directive ───────────────────────────────
  const qualityDirectives: Record<ImageQuality, string> = {
    standard: "high-quality social media photography",
    high:     "professional high-resolution travel photography — magazine editorial quality",
    ultra:    "ultra-high-resolution, pixel-perfect, award-winning travel photography — gallery and print quality",
  };
  parts.push(`[OUTPUT QUALITY] ${qualityDirectives[req.image_quality ?? "high"]}`);

  // ── Additional Context ────────────────────────────────────
  if (req.additional_context) {
    parts.push(`[ADDITIONAL CONTEXT] ${req.additional_context}`);
  }

  // ── Embedded Guardrail ────────────────────────────────────
  parts.push(
    `[CONTENT GUARDRAILS] Ensure the image is culturally respectful, dignified, and inclusive. ` +
    `No misleading, stereotypical, discriminatory, sexual, violent, or otherwise inappropriate content. ` +
    `Image must be fully suitable for a professional travel industry audience of all ages and backgrounds.`
  );

  return parts.join("\n\n");
}

// ─────────────────────────────────────────────────────────────
//  INPUT VALIDATION
// ─────────────────────────────────────────────────────────────
interface ValidationError {
  field: string;
  message: string;
}

const VALID_CATEGORIES: TravelCategory[]        = ["aspirational", "emotional", "practical", "promotional"];
const VALID_CREATOR_TYPES: CreatorType[]        = ["traveler", "blogger", "travel_agent", "brand"];
const VALID_SOCIAL_FORMATS: SocialFormat[]      = Object.keys(FORMAT_ASPECT_RATIO) as SocialFormat[];
const VALID_QUALITIES: ImageQuality[]           = ["standard", "high", "ultra"];
const VALID_MOODS: Mood[]                       = ["vibrant", "serene", "adventurous", "romantic", "luxurious", "cozy", "festive", "dreamy", "energetic"];
const VALID_OVERLAY_STYLES                      = ["subtle_caption", "bold_banner", "minimal_tag", "none"];
const VALID_PHOTO_STYLES: PhotographyStyle[]    = [
  "photorealistic", "cinematic_lighting", "candid_shot", "documentary_style",
  "aerial_view", "drone_shot", "wide_angle", "close_up", "macro_photography",
  "fisheye_lens", "low_light", "backlit", "hdr", "watercolor_illustration",
  "vector_art", "minimalist_design", "vintage_travel_poster", "cartoon_style",
];
const VALID_COLOR_PALETTES: ColorPalette[]      = ["warm_tones", "cool_tones", "pastel_palette", "monochromatic", "colorful", "earthy_hues"];
const VALID_COMPOSITIONS: Composition[]         = ["rule_of_thirds", "leading_lines", "depth_of_field", "bokeh_effect", "symmetrical", "asymmetrical_balance"];

function validateRequest(body: unknown): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, errors: [{ field: "body", message: "Request body must be a JSON object" }] };
  }

  const req = body as Record<string, unknown>;

  // prompt — required
  if (!req.prompt || typeof req.prompt !== "string" || !req.prompt.trim()) {
    errors.push({ field: "prompt", message: "prompt is required and must be a non-empty string" });
  } else if (req.prompt.length > 2000) {
    errors.push({ field: "prompt", message: "prompt must not exceed 2000 characters" });
  }

  // Enum validations
  if (req.category            && !VALID_CATEGORIES.includes(req.category as TravelCategory))
    errors.push({ field: "category",          message: `Must be one of: ${VALID_CATEGORIES.join(", ")}` });
  if (req.creator_type        && !VALID_CREATOR_TYPES.includes(req.creator_type as CreatorType))
    errors.push({ field: "creator_type",      message: `Must be one of: ${VALID_CREATOR_TYPES.join(", ")}` });
  if (req.social_format       && !VALID_SOCIAL_FORMATS.includes(req.social_format as SocialFormat))
    errors.push({ field: "social_format",     message: `Must be one of: ${VALID_SOCIAL_FORMATS.join(", ")}` });
  if (req.image_quality       && !VALID_QUALITIES.includes(req.image_quality as ImageQuality))
    errors.push({ field: "image_quality",     message: `Must be one of: ${VALID_QUALITIES.join(", ")}` });
  if (req.mood                && !VALID_MOODS.includes(req.mood as Mood))
    errors.push({ field: "mood",              message: `Must be one of: ${VALID_MOODS.join(", ")}` });
  if (req.overlay_style       && !VALID_OVERLAY_STYLES.includes(req.overlay_style as string))
    errors.push({ field: "overlay_style",     message: `Must be one of: ${VALID_OVERLAY_STYLES.join(", ")}` });
  if (req.photography_style   && !VALID_PHOTO_STYLES.includes(req.photography_style as PhotographyStyle))
    errors.push({ field: "photography_style", message: `Must be one of: ${VALID_PHOTO_STYLES.join(", ")}` });
  if (req.color_palette       && !VALID_COLOR_PALETTES.includes(req.color_palette as ColorPalette))
    errors.push({ field: "color_palette",     message: `Must be one of: ${VALID_COLOR_PALETTES.join(", ")}` });
  if (req.composition         && !VALID_COMPOSITIONS.includes(req.composition as Composition))
    errors.push({ field: "composition",       message: `Must be one of: ${VALID_COMPOSITIONS.join(", ")}` });

  // String length limits
  if (req.destination         && typeof req.destination === "string"         && req.destination.length > 200)
    errors.push({ field: "destination",       message: "Must not exceed 200 characters" });
  if (req.landmark            && typeof req.landmark === "string"            && req.landmark.length > 200)
    errors.push({ field: "landmark",          message: "Must not exceed 200 characters" });
  if (req.subjects            && typeof req.subjects === "string"            && req.subjects.length > 300)
    errors.push({ field: "subjects",          message: "Must not exceed 300 characters" });
  if (req.activity            && typeof req.activity === "string"            && req.activity.length > 300)
    errors.push({ field: "activity",          message: "Must not exceed 300 characters" });
  if (req.food_culture        && typeof req.food_culture === "string"        && req.food_culture.length > 300)
    errors.push({ field: "food_culture",      message: "Must not exceed 300 characters" });
  if (req.overlay_text        && typeof req.overlay_text === "string"        && req.overlay_text.length > 120)
    errors.push({ field: "overlay_text",      message: "Must not exceed 120 characters" });
  if (req.promotional_message && typeof req.promotional_message === "string" && req.promotional_message.length > 200)
    errors.push({ field: "promotional_message", message: "Must not exceed 200 characters" });
  if (req.additional_context  && typeof req.additional_context === "string"  && req.additional_context.length > 1000)
    errors.push({ field: "additional_context", message: "Must not exceed 1000 characters" });

  // reference_images validation
  if (req.reference_images !== undefined) {
    if (!Array.isArray(req.reference_images)) {
      errors.push({ field: "reference_images", message: "Must be an array" });
    } else {
      if (req.reference_images.length > 4) {
        errors.push({ field: "reference_images", message: "Maximum 4 reference images allowed" });
      }
      (req.reference_images as unknown[]).forEach((img, i) => {
        if (typeof img !== "string") {
          errors.push({ field: `reference_images[${i}]`, message: "Each image must be a base64 data URL or HTTPS URL string" });
        } else if (!img.startsWith("data:image/") && !img.startsWith("https://")) {
          errors.push({ field: `reference_images[${i}]`, message: "Must be a base64 data URL (data:image/...) or an HTTPS URL" });
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────────────────────────
//  GUARDRAIL CHECK (input-level safety scan)
// ─────────────────────────────────────────────────────────────
const BLOCKED_TERMS = [
  // Hate / discrimination
  "racist", "sexist", "nazi", "white suprema", "slur", "hate speech",
  "caricature", "stereotyp",
  // Adult content
  "nude", "naked", "topless", "explicit", "sexual", "nsfw", "porn",
  "erotic", "lingerie",
  // Violence & harm
  "violen", "gore", "blood", "weapon", "murder", "terror", "bomb",
  "kill", "torture",
  // Misinformation
  "fake news", "propaganda", "disinformation",
  // Privacy violation
  "hidden camera", "spy on", "surveillance", "paparazzi",
  // Child safety
  "minor", "underage", "child in",
];

function checkGuardrails(req: TravelImageRequest): string | null {
  const fullText = [
    req.prompt,
    req.additional_context,
    req.overlay_text,
    req.promotional_message,
    req.subjects,
    req.activity,
    req.food_culture,
    req.landmark,
    req.destination,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const term of BLOCKED_TERMS) {
    if (fullText.includes(term)) {
      return (
        `Your request contains content that does not align with our travel platform guidelines ` +
        `(flagged term detected). Please revise your inputs. ` +
        `All content must be respectful, inclusive, and appropriate for a professional travel audience.`
      );
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
//  JSON RESPONSE HELPER
// ─────────────────────────────────────────────────────────────
function jsonResponse(
  data: unknown,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─────────────────────────────────────────────────────────────
//  MAIN HANDLER
// ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  // ── CORS preflight ────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  // ── Method guard ──────────────────────────────────────────
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405, cors);
  }

  // ── API key guard ─────────────────────────────────────────
  if (!OPENROUTER_API_KEY) {
    console.error("[generate-image] OPENROUTER_API_KEY is not configured");
    return jsonResponse(
      { error: "Service configuration error. Please contact support." },
      503,
      cors
    );
  }

  // ── Parse body ────────────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON in request body" }, 400, cors);
  }

  // ── Validate inputs ───────────────────────────────────────
  const { valid, errors } = validateRequest(rawBody);
  if (!valid) {
    return jsonResponse({ error: "Validation failed", details: errors }, 400, cors);
  }

  const body = rawBody as TravelImageRequest;

  // ── Guardrail check ───────────────────────────────────────
  const guardrailViolation = checkGuardrails(body);
  if (guardrailViolation) {
    return jsonResponse({ error: guardrailViolation }, 422, cors);
  }

  // ── Resolve aspect ratio & quality ───────────────────────
  const aspectRatio =
    body.aspect_ratio ??
    (body.social_format ? FORMAT_ASPECT_RATIO[body.social_format] : "1:1");

  const imageSize = QUALITY_MAP[body.image_quality ?? "high"];

  // ── Build enriched prompt ─────────────────────────────────
  const enrichedPrompt = buildEnrichedPrompt(body);

  console.log("[generate-image] Request summary", {
    model:              MODEL,
    category:           body.category ?? "unspecified",
    creator_type:       body.creator_type ?? "unspecified",
    destination:        body.destination ?? "unspecified",
    social_format:      body.social_format ?? "unspecified",
    aspect_ratio:       aspectRatio,
    image_size:         imageSize,
    photography_style:  body.photography_style ?? "unspecified",
    mood:               body.mood ?? "unspecified",
    has_reference_images: (body.reference_images?.length ?? 0) > 0,
    ref_image_count:    body.reference_images?.length ?? 0,
  });

  // ── Build OpenRouter message content ─────────────────────
  const userContent: unknown[] = [];

  // Reference images go first for image-to-image context
  if (body.reference_images && body.reference_images.length > 0) {
    for (const img of body.reference_images) {
      userContent.push({ type: "image_url", image_url: { url: img } });
    }
  }

  // Enriched structured text prompt
  userContent.push({ type: "text", text: enrichedPrompt });

  // ── OpenRouter request payload ────────────────────────────
  const openRouterPayload: Record<string, unknown> = {
    model:      MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: userContent },
    ],
    modalities:   ["image", "text"],
    image_config: {
      aspect_ratio: aspectRatio,
      image_size:   imageSize,
    },
    stream: false,
  };

  // ── Call OpenRouter ───────────────────────────────────────
  let openRouterResponse: Response;
  try {
    openRouterResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization":  `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type":   "application/json",
          "HTTP-Referer":   Deno.env.get("SITE_URL") ?? "https://your-travel-app.com",
          "X-Title":        "Travel Social Media Image Generator",
        },
        body: JSON.stringify(openRouterPayload),
      }
    );
  } catch (networkErr) {
    console.error("[generate-image] Network error reaching OpenRouter:", networkErr);
    return jsonResponse(
      { error: "Unable to reach the image generation service. Please try again shortly." },
      502,
      cors
    );
  }

  // ── Handle upstream errors ────────────────────────────────
  if (!openRouterResponse.ok) {
    const errText = await openRouterResponse.text();
    console.error("[generate-image] OpenRouter error", openRouterResponse.status, errText);

    if (openRouterResponse.status === 429) {
      return jsonResponse(
        { error: "Rate limit reached. Please wait a moment and try again." },
        429,
        cors
      );
    }
    if (openRouterResponse.status === 401) {
      return jsonResponse(
        { error: "Authentication error with image generation service. Contact support." },
        401,
        cors
      );
    }

    return jsonResponse(
      {
        error:   "Image generation service returned an error",
        status:  openRouterResponse.status,
        details: errText,
      },
      openRouterResponse.status,
      cors
    );
  }

  // ── Parse model response ──────────────────────────────────
  let result: Record<string, unknown>;
  try {
    result = await openRouterResponse.json();
  } catch {
    return jsonResponse(
      { error: "Received an invalid response from the image generation service" },
      502,
      cors
    );
  }

  const choices = result.choices as Array<{ message: Record<string, unknown> }> | undefined;
  const message = choices?.[0]?.message;

  if (!message) {
    console.error("[generate-image] No message in OpenRouter response", result);
    return jsonResponse(
      { error: "No output received from model", raw: result },
      500,
      cors
    );
  }

  // ── Extract generated images ──────────────────────────────
  const generatedImages: string[] = [];
  const rawImages = message.images as
    | Array<{ image_url?: { url: string }; imageUrl?: { url: string } }>
    | undefined;

  if (rawImages && rawImages.length > 0) {
    for (const img of rawImages) {
      const url = img?.image_url?.url ?? img?.imageUrl?.url;
      if (url) generatedImages.push(url);
    }
  }

  // ── Return structured response ────────────────────────────
  return jsonResponse(
    {
      success:     true,
      images:      generatedImages,
      image_count: generatedImages.length,
      text:        (message.content as string) || null,
      model:       MODEL,

      // Echo back the resolved generation parameters for client transparency
      meta: {
        category:            body.category           ?? null,
        creator_type:        body.creator_type        ?? null,
        destination:         body.destination         ?? null,
        landmark:            body.landmark            ?? null,
        social_format:       body.social_format       ?? null,
        aspect_ratio:        aspectRatio,
        image_size:          imageSize,
        photography_style:   body.photography_style   ?? null,
        mood:                body.mood                ?? null,
        color_palette:       body.color_palette       ?? null,
        composition:         body.composition         ?? null,
        has_reference_images: (body.reference_images?.length ?? 0) > 0,
        reference_image_count: body.reference_images?.length ?? 0,
      },

      usage: result.usage ?? null,
    },
    200,
    cors
  );
});
