// Unique move modules for the non-starter lines (each exports MOVES). Add new
// modules here; src/data/skills.js registers everything.
import { MOVES as SF_LINES } from './sf_lines.js';
import { MOVES as SF_WILD } from './sf_wild.js';
import { MOVES as SF_DOOM } from './sf_doom.js';
import { MOVES as SF_REDBONE } from './sf_redbone.js';
export const EXTRA_MOVES = [SF_LINES, SF_WILD, SF_DOOM, SF_REDBONE];
