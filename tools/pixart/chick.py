import sys; sys.path.insert(0, '/home/user/Animal/tools')
from pixkit import Canvas, review
import os; S=os.environ.get('PIXOUT', '/tmp/pixout'); os.makedirs(S + '/pix', exist_ok=True)
c = Canvas(36, 46)
P = dict(k='#101010', R='#ef5d2c', r='#c54022', H='#ff9a5a', O='#9a2814', s='#8e2414',
         C='#e3242c', c='#a8162a', p='#ff7a6a', Q='#6e0c1e',
         G='#52b442', g='#2f7d30', L='#98e464', M='#1c5222',
         Y='#ffd246', y='#eaa422', W='#fff6b0', N='#a86a10',
         B='#ffb43c', b='#d4821c', F='#ff9c34', f='#c8701c',
         T='#a6ecff', t='#4aa8e2', w='#ffffff', m='#7a1424', e='#ffd23a', D='#5a1018')
c.pal = P
c.region('body', 'R', 'r', 'H', 'O', 's'); c.region('head', 'R', 'r', 'H', 'O', 's')
c.region('wing', 'R', 'r', 'H', 'O', 's'); c.region('wingf', 'R', 'r', 'H', 'O', 's')
c.region('crest', 'C', 'c', 'p', 'Q'); c.region('tail', 'C', 'c', 'p', 'Q')
c.region('calyx', 'G', 'g', 'L', 'M'); c.region('pep', 'G', 'g', 'L', 'M')
c.region('belly', 'Y', 'y', 'W', 'N'); c.region('beak', 'B', 'b', 'W', 'N'); c.region('feet', 'F', 'f', 'F', 'N')
# ---- blocking, back to front
OY = 4
import functools
_ell, _poly, _thick, _rows = c.ell, c.poly, c.thick, c.rows
c.ell = lambda cx, cy, rx, ry, rid, key=None: _ell(cx, cy + OY, rx, ry, rid, key)
c.poly = lambda pts, rid, key=None: _poly([(x, y + OY) for x, y in pts], rid, key)
c.thick = lambda pts, a, b, rid, key=None: _thick([(x, y + OY) for x, y in pts], a, b, rid, key)
c.rows = lambda x, y, rows, m=None: _rows(x, y + OY, rows, m)
_put = c.put

c.thick([(23, 31), (28, 31.5), (31, 28), (31.5, 23.5), (29.5, 21.5)], 2.3, 0.8, 'tail')
c.poly([(10, 26), (6.5, 28.5), (7.5, 32), (10.5, 31)], 'wingf')
c.thick([(13.5, 34), (13, 38.5)], 1.2, 1.0, 'feet'); c.thick([(20, 34), (20.5, 38.5)], 1.2, 1.0, 'feet')
c.ell(17, 29.5, 8.8, 7.4, 'body')
c.thick([(16.5, 6), (15.6, 1), (16.4, -2.5), (18.6, -3.6)], 2.0, 0.7, 'crest')
c.thick([(12.2, 7), (9.5, 3), (6.6, 0.6), (4.2, 1)], 1.8, 0.6, 'crest')
c.thick([(20.6, 7), (23.4, 2.8), (26.4, 1.4), (28.6, 2.4)], 1.7, 0.6, 'crest')
c.ell(16, 15.2, 10.2, 9.6, 'head')
c.poly([(14, 7), (16.4, 4.6), (19, 7), (16.4, 8.2)], 'calyx'); c.poly([(10.4, 8), (12, 5.6), (14.2, 8.2), (12.2, 9)], 'calyx'); c.poly([(18.8, 8.2), (21, 5.6), (22.6, 8), (20.8, 9)], 'calyx')
c.poly([(10.4, 24.2), (23.4, 24.2), (23, 27.6), (21.6, 30.2), (20.2, 28.4), (18.8, 31.4), (17.2, 28.8), (15.6, 31.6), (14.2, 29), (12.6, 30.8), (11.2, 27.8)], 'belly')
c.poly([(22.5, 25.5), (27, 24.5), (29.5, 28.5), (27.5, 31), (23, 30)], 'wing')
c.poly([(7.5, 14.5), (1.5, 17), (7.5, 19)], 'beak'); c.poly([(7.5, 19), (4, 19.5), (7.5, 21)], 'beak')
c.thick([(4.5, 20), (2.5, 22.5), (1.6, 25)], 1.1, 0.8, 'pep')
for r, sh, li in (('head', 0.62, 0.32), ('body', 0.56, 0.2), ('wing', 0.55, 0.3), ('wingf', 0.5, 0.2), ('crest', 0.55, 0.34), ('tail', 0.5, 0.3), ('calyx', 0.6, 0.3), ('belly', 0.66, 0.36), ('beak', 0.62, 0.4), ('feet', 0.6, 0.2), ('pep', 0.6, 0.3)):
    c.shade(r, sh, li)
c.outline('k', inner=True, order=['tail', 'wingf', 'feet', 'body', 'belly', 'wing', 'crest', 'head', 'calyx', 'beak', 'pep'])
# ---- hand-placed face: angry brows, eyes, tears, blush, ember on the chili, toes
c.rows(7, 10, ['DD...', '.DD..', '..D..'])            # far brow (outer high, inner low toward beak)
c.rows(14, 9, ['....DD', '..DD..', '.D....'])          # near brow
c.rows(8, 12, ['kk', 'wk', 'kk'])                       # far eye
c.rows(14, 11, ['kkk', 'kwk', 'kwk', 'kkk'])           # near eye
c.rows(9, 15, ['T', 'T', 't'])                          # far tear
c.rows(15, 15, ['TT.', '.TT', '.Tt', '..t'])          # near tear (waterfall)
c.rows(18, 15, ['ee'])                                   # blush hint
c.rows(1, 25, ['e'])                                     # chili ember
_put(18, 15 + OY, 'p'); _put(19, 15 + OY, 'p')
# glossy highlights on the chili pods
for (x, y) in ((15, 2), (8, 3), (24, 3)): _put(x, y + OY, 'p')
c.rows(11, 38, ['FFk', 'kfk'][:0])
open(S + '/pix/chick_v4.txt', 'w').write('\n'.join(c.ascii()))
c.png(S + '/pix/chick_v4.png', z=1)
review([S + '/pkref/255.png', S + '/pix/chick_v4.png', S + '/pkref/393.png', S + '/pkref/498.png'], S + '/pix/cmp4.png', z=8)
print('\n'.join(c.ascii()))
