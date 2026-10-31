// The look: how the stage is styled and how each mood is graded. The realistic HD look is the default
// (render/composite.js: AgX tone mapping, a neutral grade); ?look=toon brings back the old cel shading with ink
// outlines for comparison, ?ao=0 turns the ambient occlusion off, ?tone=aces|neutral swaps the tone curve,
// ?msaa=0|4 and ?fxaa=1 force the anti-aliasing. Every asset wears a crisp near-black ink outline (silhouettes +
// main creases, render/composite.js): ?ink=0 turns it off, ?ink=0.5 halves it, ?inkw=2 sets its width in pixels.
// POST (per mood) is a light-touch, natural grade: bloom (strength, threshold in scene-referred units), saturation,
// a gentle S-curve, white balance (multipliers before the tone curve), a hint of vignette and black lift. The
// cutscene director eases these keys (cinema.js); the keys it knows from the old HD-2D pass are simply ignored.
export const POST = {
  day: { bloom: 0.1, threshold: 1.6, sat: 1.06, contrast: 0.14, wb: [1.0, 1.0, 1.0], vig: 0.16, lift: 0 },
  golden: { bloom: 0.14, threshold: 1.4, sat: 1.05, contrast: 0.14, wb: [1.02, 1.0, 0.97], vig: 0.2, lift: 0 },
  dusk: { bloom: 0.2, threshold: 1.1, sat: 1.04, contrast: 0.12, wb: [1.0, 0.99, 1.01], vig: 0.24, lift: 0.004 },
  night: { bloom: 0.28, threshold: 0.9, sat: 1.0, contrast: 0.1, wb: [0.96, 0.99, 1.06], vig: 0.26, lift: 0.006 },
};

/** style the stage from the URL parameters (the realistic HD look unless ?look=toon) */
export function setupStage(stage, params = new URLSearchParams()) {
  if (params.get('look') === 'toon') { stage.setStyle({ ink: true, toon: true, inkCrease: 0.03 }); return stage; }
  const num = (k, d) => (params.get(k) === null ? d : +params.get(k));
  stage.setStyle({ hd: true, ao: num('ao', 1), inkA: num('ink', 1), inkW: params.get('inkw') === null ? undefined : +params.get('inkw'), haze: num('haze', 1), pools: num('pools', 1), tone: params.get('tone') || 'agx', msaa: params.get('msaa') === null ? undefined : +params.get('msaa'), fxaa: params.get('fxaa') === null ? undefined : params.get('fxaa') === '1' });
  return stage;
}
