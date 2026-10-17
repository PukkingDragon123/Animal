import sys; sys.path.insert(0, '/home/user/Animal/tools')
from pixkit import Canvas, review
import os; S=os.environ.get('PIXOUT', '/tmp/pixout'); os.makedirs(S + '/pix', exist_ok=True)
c = Canvas(40, 44)
P = dict(k='#101018', M='#ffc8c0', m='#e88a98', Q='#fff0ea',
         A='#8fdcf6', a='#58b0e2', V='#d8f6ff', U='#2e78b8', X='#3a8cc8',          # water ball
         F='#ff7a62', f='#d84a4a', h='#ffb09a', E='#9a2638',                       # lionfish coral
         Z='#fff4ea', z='#e6c8c8',                                                   # white stripes
         J='#ffd23a', j='#d89a14', I='#fff2a0', K='#8a5a0a', R='#ff4a6a',            # crown + ruby
         P='#ff6a9a', p='#d23a72', w='#ffffff', e='#2a1426', n='#5ac8ff', B='#c8f2ff')
c.pal = P
c.region('ball', 'A', 'a', 'V', 'X', 'U')
c.region('fish', 'F', 'f', 'h', 'E')
c.region('finb', 'F', 'f', 'h', 'E'); c.region('finf', 'F', 'f', 'h', 'E'); c.region('dors', 'F', 'f', 'h', 'E')
c.region('crown', 'J', 'j', 'I', 'K')
c.region('lips', 'P', 'p', 'w', 'E')
OY = 2
# back fins and dorsal spines poke out of the ball
c.poly([(29, 22 + OY), (38, 16 + OY), (36.5, 21 + OY), (39, 23 + OY), (36, 26 + OY), (38, 30 + OY), (30, 28 + OY)], 'finb')
# spiny lionfish mane fanning out around the head (pokes out of the ball)
c.region('mane', 'M', 'm', 'Q', 'E')
c.poly([(12, 14 + OY), (5, 9 + OY), (7, 13 + OY), (1, 15 + OY), (6, 18 + OY), (0, 22 + OY), (6, 23 + OY), (3, 28 + OY), (10, 26 + OY)], 'mane')
# the soft water ball (bouncy: slightly squashed)
c.ell(20, 24 + OY, 16.5, 15.5, 'ball')
c.shade('ball', 0.66, 0.3)
# the lionfish inside
c.ell(19, 24 + OY, 10, 8, 'fish')
c.poly([(27, 21 + OY), (33, 17.5 + OY), (31.5, 24 + OY), (33.5, 30 + OY), (27.5, 27 + OY)], 'fish')
c.shade('fish', 0.6, 0.3)
# white stripes (paint over the fish)
for x0 in (15, 19, 23, 27):
    for y in range(16, 33):
        for x in (x0 + (y - 16) // 6,):
            if c.reg[y + OY][x] == 'fish' and c.px[y + OY][x] in ('F', 'h'): c.px[y + OY][x] = 'Z'
            elif c.reg[y + OY][x] == 'fish' and c.px[y + OY][x] == 'f': c.px[y + OY][x] = 'z'
# big pouty lips
c.ell(9.6, 26 + OY, 2.4, 2.2, 'lips')
c.shade('lips', 0.6, 0.3)
# front fan fin sticking out of the ball (lower left)
c.poly([(12, 29 + OY), (3, 33 + OY), (6, 35 + OY), (2, 38 + OY), (8, 38 + OY), (7, 41 + OY), (15, 34 + OY)], 'finf')
c.shade('finf', 0.6, 0.3); c.shade('finb', 0.6, 0.3); c.shade('mane', 0.62, 0.3)
# crown poking out the top
c.poly([(12.5, 13 + OY), (12.5, 6 + OY), (15, 9 + OY), (17.5, 4 + OY), (20, 8.5 + OY), (22.5, 4 + OY), (24.5, 9 + OY), (27, 6 + OY), (26.5, 13 + OY)], 'crown')
c.shade('crown', 0.6, 0.35)
c.outline('k', inner=True, order=['finb', 'mane', 'ball', 'fish', 'lips', 'finf', 'crown'])
# hand details: proud half-lidded eye, crown jewel, fin stripes, ball glints and bubbles
c.rows(11, 19 + OY, ['kkkk', 'kwek', 'keek', '.kk.'])
c.rows(10, 18 + OY, ['kk....'])
c.rows(18, 10 + OY, ['RR'])
def ray(pts):
    import copy
    keep = [r[:] for r in c.px]
    c.line(pts, 'f')
    for y in range(c.h):
        for x in range(c.w):
            if c.px[y][x] != keep[y][x] and c.reg[y][x] not in ('mane', 'finf', 'finb'): c.px[y][x] = keep[y][x]
ray([(11, 15 + OY), (6, 10 + OY)]); ray([(10, 18 + OY), (3, 16 + OY)]); ray([(10, 21 + OY), (2, 22 + OY)]); ray([(10, 24 + OY), (5, 27 + OY)])
ray([(13, 31 + OY), (5, 36 + OY)]); ray([(13, 33 + OY), (8, 39 + OY)]); ray([(31, 24 + OY), (37, 18 + OY)]); ray([(31, 26 + OY), (36, 28 + OY)])
c.rows(9, 10 + OY, ['VV', 'V.']); c.rows(7, 13 + OY, ['V'])
c.rows(30, 36 + OY, ['B']); c.rows(33, 12 + OY, ['.kk', 'kBk', '.kk'])
c.rows(8, 26 + OY, ['k', 'k'])
open(S + '/pix/bubble.txt', 'w').write('\n'.join(c.ascii()))
c.png(S + '/pix/bubble.png', z=1)
review([S + '/pkref/393.png', S + '/pix/bubble.png', S + '/pkref/258.png'], S + '/pix/cmp_b3.png', z=8)
