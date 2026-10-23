// Species modules for the non-starter lines (each exports SPECIES). Later
// modules override earlier entries in src/data/species.js.
import { SPECIES as SF_LINES } from './sf_lines.js';
import { SPECIES as SF_WILD } from './sf_wild.js';
import { SPECIES as SF_LEGENDS } from './sf_legends.js';
import { SPECIES as SF_DOOM } from './sf_doom.js';
import { SPECIES as SF_REDBONE } from './sf_redbone.js';
import { SPECIES as SF_GREENDAY } from './sf_greenday.js';
import { SPECIES as SF_ARCTIC } from './sf_arctic.js';
import { SPECIES as SF_KISS } from './sf_kiss.js';
export const EXTRA_SPECIES = [SF_LINES, SF_WILD, SF_LEGENDS, SF_DOOM, SF_REDBONE, SF_GREENDAY, SF_ARCTIC, SF_KISS];
