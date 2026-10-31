// The look: how the stage is styled and how the HD-2D pass finishes each mood. The realistic HD look is
// the default; ?look=toon brings back the old cel shading with ink outlines for comparison, ?ao=0 turns
// the ambient occlusion off, ?dof=0 the close camera's depth of field. Every asset wears a warm dark ink
// outline (silhouettes + strong creases, render/composite.js): ?ink=0 turns it off, ?ink=0.5 halves it,
// ?inkw=2 sets its width in pixels.
// POST (per mood) feeds src/px/hd2d.js: tilt-shift focus band / blur, bloom (strength, threshold, wide
// share), god rays, vignette, and the grade: saturation, contrast, split toning (shadow / highlight tints),
// warmth, a night blue shift and the lift of the blacks; vibrance lifts muted colours without pushing vivid ones.
export const POST = {
  day: { focus: 0.5, band: 0.27, dof: 0.62, bloom: 0.28, threshold: 0.86, wide: 0.45, rays: 0.03, vig: 0.26, warm: 0.38, sat: 1.16, vibe: 0.36, contrast: 1.06, night: 0, shadowTint: [0.97, 0.97, 1.03], highTint: [1.05, 1.02, 0.95], lift: 0.008 },
  golden: { focus: 0.5, band: 0.27, dof: 0.62, bloom: 0.38, threshold: 0.8, wide: 0.55, rays: 0.06, vig: 0.3, warm: 0.48, sat: 1.14, vibe: 0.32, contrast: 1.07, night: 0, shadowTint: [0.96, 0.95, 1.04], highTint: [1.07, 1.01, 0.91], lift: 0.01 },
  dusk: { focus: 0.5, band: 0.27, dof: 0.62, bloom: 0.62, threshold: 0.64, wide: 0.62, rays: 0, vig: 0.34, warm: 0.4, sat: 1.12, vibe: 0.3, contrast: 1.06, night: 0.02, shadowTint: [0.95, 0.94, 1.05], highTint: [1.1, 1.01, 0.9], lift: 0.014 },
  night: { focus: 0.5, band: 0.27, dof: 0.62, bloom: 0.78, threshold: 0.6, wide: 0.68, rays: 0, vig: 0.34, warm: 0.42, sat: 1.12, vibe: 0.3, contrast: 1.05, night: 0.03, shadowTint: [0.93, 0.95, 1.08], highTint: [1.12, 1.02, 0.86], lift: 0.02 },
};

/** style the stage from the URL parameters (the realistic HD look unless ?look=toon) */
export function setupStage(stage, params = new URLSearchParams()) {
  if (params.get('look') === 'toon') { stage.setStyle({ ink: true, toon: true, inkCrease: 0.03 }); return stage; }
  const num = (k, d) => (params.get(k) === null ? d : +params.get(k));
  stage.setStyle({ hd: true, ao: num('ao', 1), inkA: num('ink', 1), inkW: params.get('inkw') === null ? undefined : +params.get('inkw'), haze: num('haze', 1), pools: num('pools', 1), dof: num('dof', globalThis.TOKON_LITE ? 0 : 1) });
  return stage;
}
