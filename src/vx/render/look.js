// The look: how the stage is styled and how the HD-2D pass finishes each mood. The realistic HD look is
// the default; ?look=toon brings back the old cel shading with ink outlines for comparison, ?ao=0 turns
// the ambient occlusion off, ?ink=0.2 adds a faint silhouette line.
// POST (per mood) feeds src/px/hd2d.js: tilt-shift focus band / blur, bloom (strength, threshold, wide
// share), god rays, vignette, and the grade: saturation, contrast, split toning (shadow / highlight tints),
// warmth, a night blue shift and the lift of the blacks.
export const POST = {
  day: { focus: 0.5, band: 0.27, dof: 0.62, bloom: 0.32, threshold: 0.86, wide: 0.45, rays: 0.04, vig: 0.38, warm: 0.3, sat: 1.12, contrast: 1.05, night: 0, shadowTint: [0.93, 0.95, 1.06], highTint: [1.04, 1.01, 0.95], lift: 0.012 },
  golden: { focus: 0.5, band: 0.27, dof: 0.62, bloom: 0.42, threshold: 0.8, wide: 0.55, rays: 0.08, vig: 0.42, warm: 0.45, sat: 1.12, contrast: 1.06, night: 0, shadowTint: [0.9, 0.9, 1.08], highTint: [1.07, 1.0, 0.9], lift: 0.012 },
  dusk: { focus: 0.5, band: 0.27, dof: 0.62, bloom: 0.75, threshold: 0.62, wide: 0.65, rays: 0, vig: 0.5, warm: 0.3, sat: 1.14, contrast: 1.06, night: 0.04, shadowTint: [0.9, 0.88, 1.1], highTint: [1.08, 1.0, 0.9], lift: 0.016 },
  night: { focus: 0.5, band: 0.27, dof: 0.62, bloom: 0.95, threshold: 0.55, wide: 0.7, rays: 0, vig: 0.5, warm: 0.2, sat: 1.12, contrast: 1.06, night: 0.06, shadowTint: [0.86, 0.9, 1.14], highTint: [1.08, 1.0, 0.88], lift: 0.02 },
};

/** style the stage from the URL parameters (the realistic HD look unless ?look=toon) */
export function setupStage(stage, params = new URLSearchParams()) {
  if (params.get('look') === 'toon') { stage.setStyle({ ink: true, toon: true, inkCrease: 0.03 }); return stage; }
  const num = (k, d) => (params.get(k) === null ? d : +params.get(k));
  stage.setStyle({ hd: true, ao: num('ao', 1), inkA: num('ink', 0), haze: num('haze', 1), pools: num('pools', 1) });
  return stage;
}
