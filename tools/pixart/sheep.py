import sys; sys.path.insert(0, '/home/user/Animal/tools')
from pixkit import Canvas, review
import os; S=os.environ.get('PIXOUT', '/tmp/pixout'); os.makedirs(S + '/pix', exist_ok=True)
# Strawbaa: a gentle, sleepy strawberry sheep. Its wool IS the strawberry (rose-red with seed specks),
# a leafy calyx sits on its head like a little hat, cream face, tiny curled horns, a white blossom behind its ear.
c = Canvas(44, 38)
P = dict(k='#141018',
         S='#ff5a78', s='#d23a5e', U='#ff9ab0', V='#8e1c40', Y='#ffe07a',          # strawberry wool + seeds
         C='#ffe8d0', c='#e6bf9e', W='#fff8f0', N='#9a6a4a',                       # cream face/legs
         G='#56b844', g='#2f7d30', L='#a0e66a', M='#1c5222',                       # calyx
         H='#f6d6c0', h='#c8a088',                                                  # horns
         D='#f2dcc4', d='#5a3a3a', B='#ffffff', b='#ffd84a', p='#ff9ab0', e='#2a1a20')
c.pal = P
c.region('wool', 'S', 's', 'U', 'V'); c.region('woolb', 'S', 's', 'U', 'V')
c.region('face', 'C', 'c', 'W', 'N'); c.region('ear', 'C', 'c', 'W', 'N')
c.region('legs', 'D', 'c', 'D', 'N'); c.region('legsb', 'c', 'N', 'c', 'N')
c.region('calyx', 'G', 'g', 'L', 'M'); c.region('horn', 'H', 'h', 'W', 'N'); c.region('flower', 'B', 'W', 'B', 'N')
# legs (back pair darker, behind)
c.region('hoof', 'd', 'd', 'D', 'd')
for x in (28, 35): c.thick([(x, 28), (x, 33)], 1.5, 1.4, 'legsb')
# fluffy wool body: a cloud of puffs
for (x, y, r) in ((25, 19, 9.5), (33, 19, 7), (27, 25, 7.5), (19, 24, 6.5)):
    c.ell(x, y, r, r * 0.92, 'wool')
# scalloped puffs along the silhouette
for (x, y, r) in ((17, 13, 3.2), (21.5, 10.5, 3.4), (26.5, 9.5, 3.4), (31.5, 11, 3.3), (36, 14.5, 3.1), (39, 19.5, 3), (38, 25, 3), (34, 28.5, 3.2), (28.5, 30.5, 3.2), (22.5, 30, 3.2), (16.5, 27.5, 3)):
    c.ell(x, y, r, r, 'wool')
for x in (18, 24): c.thick([(x, 29), (x, 34)], 1.6, 1.5, 'legs')
c.shade('wool', 0.6, 0.26); c.shade('legs', 0.62, 0.1); c.shade('legsb', 0.5, 0.1)
for x in (18, 24, 28, 35):
    for y in (33, 34):
        for dx in (-1, 0, 1):
            if c.px[y][x + dx] is not None: c.px[y][x + dx] = 'd'; c.reg[y][x + dx] = 'hoof'
# head: cream face with a wool fringe, ear and horns
c.thick([(12.5, 13), (8.5, 15.5)], 2.0, 1.6, 'ear')
c.ell(11, 19.5, 7.6, 6.8, 'face')
c.shade('face', 0.62, 0.3); c.shade('ear', 0.6, 0.3)
c.ell(14, 13.5, 5.2, 3.6, 'woolb'); c.ell(10, 14, 3.2, 2.6, 'woolb')
c.shade('woolb', 0.65, 0.3)
c.thick([(15, 14), (17.5, 12), (18.5, 14.5), (16.8, 15.8)], 1.3, 0.9, 'horn'); c.shade('horn', 0.6, 0.3)
# leafy calyx hat with a stem
c.poly([(9, 11.5), (11, 8.5), (12.5, 10.5), (14.5, 7), (16, 10.5), (18.5, 9), (18, 12.5), (13.5, 13)], 'calyx')
c.thick([(14.5, 8), (14, 4.5), (16, 3)], 0.9, 0.7, 'calyx')
c.shade('calyx', 0.6, 0.3)
# white strawberry blossom behind the ear
c.ell(7.5, 13.5, 2.2, 2.1, 'flower')
c.outline('k', inner=True, order=['legsb', 'hoof', 'wool', 'legs', 'ear', 'face', 'woolb', 'horn', 'flower', 'calyx'])
# seed specks on the wool (hand placed, sparse and even)
for (x, y) in ((22, 12), (28, 11), (34, 14), (19, 19), (25, 17), (31, 19), (37, 20), (23, 24), (29, 26), (34, 27), (20, 28), (16, 23)):
    if c.reg[y][x] in ('wool', 'woolb') and c.px[y][x] in ('S', 'U', 's'): c.px[y][x] = 'Y' if c.px[y][x] != 's' else 'b'
for (x, y) in ((22, 13), (29, 12), (34, 17), (25, 21), (31, 24), (20, 26)):
    c.rows(x, y, ['U..U', '.UU.'])
# face: gentle sleepy eye with lashes, blush, nose, smile
c.rows(7, 18, ['.kkk', 'kk.k', '.wk.'][:2]); c.rows(8, 19, ['k'])
c.rows(10, 21, ['pp'])
c.rows(4, 21, ['k.', '.k'])
c.rows(6, 23, ['kk'])
c.rows(7, 13, ['.b.']); c.rows(6, 12, ['.B.'])
open(S + '/pix/sheep.txt', 'w').write('\n'.join(c.ascii()))
c.png(S + '/pix/sheep.png', z=1)
review([S + '/pkref/179.png', S + '/pix/sheep.png', S + '/pkref/420.png'], S + '/pix/cmp_s2.png', z=8)
