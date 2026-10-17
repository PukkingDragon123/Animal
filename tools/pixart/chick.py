# Chilichick (base form) — a small fluffy white chick with a big red comb, eyes
# squeezed shut and tears flying, wailing with its beak open while hugging a red
# chili pepper under its wing. Concept: owner's reference (white chicken, red comb,
# crying, eating a chili, breathing fire). Hand-finished pixel art.
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from pixkit import Canvas, review
S = os.environ.get('PIXOUT', '/tmp/pixout'); os.makedirs(S + '/pix', exist_ok=True)
c = Canvas(46, 46)
c.pal = dict(k='#3c2a2e',
             W='#fffaf0', w='#ebe0d8', v='#cdbcc0', q='#a08c96',          # white feathers
             R='#ee3b30', r='#b81f2c', h='#ff8a78', o='#7a1020',          # comb / wattle
             Y='#ffca3a', y='#e0901c', l='#fff2a8', n='#9a5a10',          # beak
             F='#ffb030', f='#d07818',                                     # feet
             C='#e3262a', c='#a01224', p='#ff7a6c', G='#5ab83a', g='#2f7a2c',   # chili
             T='#a6eaff', t='#4aa6e0', B='#ffb4bc', m='#8a1c2c', Q='#ff6a7a', X='#ffffff')
c.region('tail', 'W', 'w', 'W', 'q', 'v'); c.region('body', 'W', 'w', 'W', 'q', 'v'); c.region('head', 'W', 'w', 'W', 'q', 'v')
c.region('wing', 'W', 'w', 'W', 'q', 'v'); c.region('comb', 'R', 'r', 'h', 'o'); c.region('wattle', 'R', 'r', 'h', 'o')
c.region('beak', 'Y', 'y', 'l', 'n'); c.region('feet', 'F', 'f', 'F', 'n'); c.region('chili', 'C', 'c', 'p', 'o'); c.region('stem', 'G', 'g', 'G', 'g')
# tail feathers fanning up behind
for pts in ([(31, 30), (37, 22), (40, 15)], [(32, 31), (40, 26), (44, 21)], [(32, 33), (41, 31), (44, 28)]):
    c.thick(pts, 3.2, 1.6, 'tail')
# feet (splayed, three toes)
for (x, y) in ((17, 38), (27, 39)):
    c.thick([(x, y), (x, y + 3)], 1.2, 1.1, 'feet')
    c.thick([(x, y + 3), (x - 3, y + 5)], 0.9, 0.8, 'feet'); c.thick([(x, y + 3), (x, y + 6)], 0.9, 0.8, 'feet'); c.thick([(x, y + 3), (x + 3, y + 5)], 0.9, 0.8, 'feet')
# fluffy round body with scalloped edges
c.ell(23, 29, 12, 10, 'body')
for (x, y, r) in ((13, 31, 3), (16, 36, 3), (21, 38.5, 3), (27, 38.5, 3), (32, 35.5, 3), (35, 30, 2.8)):
    c.ell(x, y, r, r, 'body')
# comb (three round lobes) behind the head top
c.ell(16, 7, 3.2, 3.4, 'comb'); c.ell(21, 4.5, 4, 4.4, 'comb'); c.ell(26.5, 6.5, 3.4, 3.8, 'comb')
# head
c.ell(20, 16, 9.5, 9, 'head')
for (x, y, r) in ((12, 21, 2.6), (28, 21, 2.4), (29, 13, 2.2)):
    c.ell(x, y, r, r, 'head')
# beak wailing open (upper + lower), wattle under it
c.poly([(12, 14), (4, 15.5), (11, 18)], 'beak')
c.poly([(11, 19), (5, 20.5), (11.5, 22.5)], 'beak')
c.ell(11, 22.5, 1.8, 2.4, 'wattle')
# red chili hugged against the chest, stem to the right
c.thick([(12, 31), (17, 29), (23, 26.5)], 1.4, 2.6, 'chili')
c.poly([(23, 24.5), (26, 23.5), (27.5, 25.5), (25, 27.5)], 'stem')
# near wing wrapped over the chili
c.poly([(22, 25), (27, 22.5), (33, 25), (34, 30), (31, 33), (32, 35), (27, 34), (28, 36), (23, 33), (21, 29)], 'wing')
for r, sh, li in (('tail', 0.55, 0.25), ('body', 0.58, 0.22), ('head', 0.62, 0.3), ('wing', 0.55, 0.25), ('comb', 0.58, 0.32), ('wattle', 0.6, 0.3), ('beak', 0.6, 0.35), ('feet', 0.6, 0.2), ('chili', 0.55, 0.35), ('stem', 0.6, 0.3)):
    c.shade(r, sh, li)
c.outline('k', inner=True, order=['tail', 'feet', 'body', 'comb', 'head', 'wattle', 'beak', 'chili', 'stem', 'wing'])
# ---- hand finish: squeezed-shut crying eyes, mouth, tears, blush, feather marks, bite
c.rows(13, 12, ['k..', '.kk', 'k..'])          # far eye  >
c.rows(20, 12, ['kk..', '..kk', 'kk..'])        # near eye >
c.rows(19, 10, ['.k.k'])                        # lashes
c.rows(6, 18, ['mmQ', 'mQ.'])                   # open mouth / tongue between the beak halves
c.rows(13, 15, ['T', 'T', 't'])                 # far tear stream
c.rows(21, 15, ['TT', '.T', '.t'])              # near tear stream
c.rows(8, 8, ['.T', 'TX', 'tT'])                # flying droplets
c.rows(29, 9, ['XT', 'Tt'])
c.rows(31, 16, ['T', 't'])
c.rows(23, 17, ['BB']); c.rows(14, 17, ['B'])   # blush
c.rows(12, 30, ['_'])                           # bite out of the chili tip
c.rows(26, 28, ['w.', '.w']); c.rows(29, 30, ['w']); c.rows(24, 31, ['w'])   # feather marks on the wing
c.rows(18, 33, ['w..w']); c.rows(37, 21, ['w']); c.rows(40, 26, ['w'])
open(S + '/pix/chick_v5.txt', 'w').write('\n'.join(c.ascii()))
c.png(S + '/pix/chick_v5.png', z=1)
if os.path.exists(S + '/pkref/255.png'):
    review([S + '/pkref/255.png', S + '/pix/chick_v5.png', S + '/pkref/393.png', S + '/pkref/396.png' if os.path.exists(S + '/pkref/396.png') else S + '/pkref/179.png'], S + '/pix/cmp_c5.png', z=8)
