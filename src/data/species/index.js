// Species modules for the non-starter lines (each exports SPECIES). Later
// modules override earlier entries in src/data/species.js.
import { SPECIES as SF_LINES } from './sf_lines.js';
import { SPECIES as SF_WILD } from './sf_wild.js';
import { SPECIES as SF_LEGENDS } from './sf_legends.js';
export const EXTRA_SPECIES = [SF_LINES, SF_WILD, SF_LEGENDS];
