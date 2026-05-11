const vibeLanguage = {
  cinematic: {
    vibeSummary: [
      "The track leans toward cinematic storytelling and spacious pacing.",
      "Emotional tension builds through atmosphere more than through density.",
      "There is strong room here for narrative vocals or reflective melody."
    ],
    traits: ["cinematic", "layered", "spacious transitions", "emotional pacing"],
    arrangement: "The intro creates anticipation effectively, and the second half feels like it could evolve through one more lifted moment rather than more complexity.",
    identity: "Your sound leans toward emotional atmosphere and spacious transitions rather than overwhelming complexity.",
    energy: "Late-night cinematic energy with a steady emotional climb."
  },
  soulful: {
    vibeSummary: [
      "The emotional center feels warm, personal, and lived-in.",
      "There is a reflective pull here that feels human before it feels polished.",
      "The melodic choices feel guided by feeling rather than force."
    ],
    traits: ["soulful", "human warmth", "melodic tension", "open phrasing"],
    arrangement: "The strongest moments breathe well already. Letting a few transitions linger slightly longer could deepen the emotional payoff.",
    identity: "You seem to prioritize feeling first, which gives the track a grounded emotional core.",
    energy: "Soulful movement with warmth, patience, and emotional lift."
  },
  nostalgic: {
    vibeSummary: [
      "The record carries memory-driven warmth without feeling borrowed.",
      "There is a soft emotional color that feels familiar in a personal way.",
      "The atmosphere suggests reflection more than nostalgia for its own sake."
    ],
    traits: ["nostalgic", "soft-focus atmosphere", "memory-rich", "gentle tension"],
    arrangement: "The opening lands emotionally right away. A stronger contrast later in the beat could make the reflective mood hit even harder.",
    identity: "Your direction feels tied to memory, tone, and atmosphere more than surface-level style choices.",
    energy: "Reflective momentum with a familiar emotional glow."
  },
  dark: {
    vibeSummary: [
      "The emotional pressure feels controlled instead of crowded.",
      "There is a low-lit tension here that feels intentional and immersive.",
      "Texture is doing real storytelling work across the record."
    ],
    traits: ["dark", "textured", "controlled suspense", "focused pressure"],
    arrangement: "The transitions create immersion without overcrowding the sound. One sharper release point could make the darker sections feel even heavier.",
    identity: "You seem drawn to mood-first construction where shadow and restraint do as much work as melody or drums.",
    energy: "Dark, focused pressure with spacious control."
  },
  uplifting: {
    vibeSummary: [
      "The record carries forward energy without losing sincerity.",
      "There is emotional lift here that feels earned, not generic.",
      "The motion feels hopeful while still leaving room for depth."
    ],
    traits: ["uplifting", "open energy", "bright transitions", "hopeful lift"],
    arrangement: "The build feels natural. A slightly bigger contrast moment could make the release land with even more emotional clarity.",
    identity: "Your work seems to carry listeners forward through openness, movement, and emotional lift.",
    energy: "Bright momentum with emotional release."
  },
  dreamy: {
    vibeSummary: [
      "The track feels immersive, soft-edged, and inward-looking.",
      "There is a floating emotional motion that keeps the mood intact.",
      "The atmosphere carries feeling without needing to shout for attention."
    ],
    traits: ["dreamy", "floating layers", "immersive pacing", "soft atmosphere"],
    arrangement: "The spacing gives melodies and vocals room to glow. One more anchor moment could make the emotional arc feel even more complete.",
    identity: "Your direction values drift, softness, and immersion over obvious force.",
    energy: "Soft-focus movement with immersive emotional flow."
  },
  experimental: {
    vibeSummary: [
      "The identity feels strongest where the track takes a risk without losing its center.",
      "There is curiosity in the structure that gives the beat a living edge.",
      "Unfamiliar turns are helping the idea feel personal instead of polished into sameness."
    ],
    traits: ["experimental", "risk-friendly", "creative tension", "surprising movement"],
    arrangement: "The unpredictability gives the record personality. One recurring anchor could help listeners hold the identity more clearly as the beat evolves.",
    identity: "You seem comfortable exploring unfamiliar turns, and that instinct gives the work its own creative fingerprint.",
    energy: "Risk-forward motion with unstable beauty."
  },
  atmospheric: {
    vibeSummary: [
      "The mood is carried by space as much as by the notes themselves.",
      "Atmosphere is doing more than decoration here. It feels structural.",
      "The record leans into immersion rather than immediate force."
    ],
    traits: ["atmospheric", "wide spacing", "immersive motion", "emotional air"],
    arrangement: "Your transitions create immersion without overcrowding the sound. The beat already knows how to leave room for imagination.",
    identity: "Your sound seems to trust space, air, and emotional framing as part of its signature.",
    energy: "Wide atmospheric motion with spacious emotional pull."
  },
  aggressive: {
    vibeSummary: [
      "The energy arrives with clarity and intent.",
      "The beat feels performance-ready without sounding one-dimensional.",
      "There is real pressure here, but it still feels shaped rather than chaotic."
    ],
    traits: ["aggressive", "tight pockets", "impact-focused", "forward energy"],
    arrangement: "The heavier sections already hit. A few strategic pauses or breakdowns could make that pressure feel even more deliberate.",
    identity: "You seem to shape force carefully, which makes the aggression feel controlled instead of blunt.",
    energy: "High-pressure momentum with strong attack."
  }
};

const stageModifiers = {
  unfinished: {
    note: "Even in an unfinished state, the emotional direction already feels visible.",
    trait: "early signal clarity",
  },
  experimental: {
    note: "The unfinished edges actually help reveal the personality of the idea.",
    trait: "risk-forward instinct",
  },
  polished: {
    note: "The track already feels considered, with a clear frame around its strongest moments.",
    trait: "intentional finish",
  },
  "rough idea": {
    note: "As a rough idea, the creative identity is already present enough to build around carefully.",
    trait: "seed-stage identity",
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function generateAnalysis(data) {
  const primaryMood = vibeLanguage[data.primaryMood] ? data.primaryMood : "cinematic";
  const profile = vibeLanguage[primaryMood];
  const stage = stageModifiers[data.stage] || stageModifiers.unfinished;

  const inspirationLength = data.inspiration.trim().length;
  const identityLength = data.identity.trim().length;
  const hasInspirations = data.inspirations.trim().length > 0;
  const moodCount = data.selectedMoods.length || 1;

  const emotionalRange = clamp(56 + Math.round(identityLength / 7) + (primaryMood === "soulful" || primaryMood === "dreamy" ? 10 : 0), 48, 96);
  const energyRange = clamp(50 + (primaryMood === "aggressive" ? 22 : 0) + (primaryMood === "experimental" ? 14 : 0) + (data.stage === "polished" ? 4 : 10), 44, 95);
  const atmosphereRange = clamp(58 + (primaryMood === "cinematic" || primaryMood === "dark" || primaryMood === "atmospheric" ? 20 : 8) + Math.round(inspirationLength / 18), 50, 97);

  const energyBars = [
    clamp(32 + emotionalRange / 2, 20, 92),
    clamp(24 + energyRange / 1.8, 18, 94),
    clamp(20 + atmosphereRange / 1.55, 18, 96),
    clamp(18 + emotionalRange / 1.9, 18, 88),
    clamp(24 + energyRange / 2, 18, 94),
    clamp(18 + atmosphereRange / 1.7, 18, 94),
    clamp(22 + emotionalRange / 1.8, 18, 90),
    clamp(20 + energyRange / 1.85, 18, 92),
    clamp(18 + atmosphereRange / 1.75, 18, 90),
    clamp(24 + emotionalRange / 2, 18, 92),
    clamp(22 + energyRange / 1.9, 18, 92),
    clamp(20 + atmosphereRange / 1.8, 18, 90)
  ];

  const traits = unique([
    ...profile.traits,
    ...data.selectedMoods.filter((entry) => entry !== primaryMood),
    stage.trait,
    hasInspirations ? "story-aware influences" : "self-guided direction"
  ]).slice(0, 7);

  const vibeSummary = [...profile.vibeSummary, stage.note].slice(0, 4);

  const arrangementInsight = identityLength > 70
    ? `${profile.arrangement} The way you described what makes this feel like you suggests strong creative self-awareness.`
    : profile.arrangement;

  const identityInsight = hasInspirations
    ? `${profile.identity} The references you shared feel more like emotional landmarks than templates, which keeps the direction personal.`
    : `${profile.identity} The idea already feels self-contained enough to grow without leaning on obvious formulas.`;

  return {
    vibeSummary,
    traits,
    arrangementInsight,
    identityInsight,
    energyCaption: profile.energy,
    energyBars,
    accuracyPrompt: moodCount > 1
      ? "NovaTone noticed a blend of moods rather than one fixed lane. That usually means the identity is coming from contrast as much as from genre."
      : "NovaTone read one dominant emotional lane here, but the nuance still lives in how the textures and spacing move around it."
  };
}
