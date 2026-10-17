"""Pixel-art construction kit (offline authoring helper, not used by the game).

Workflow used for every sprite, matching the Gen-5 handheld sprite style:
  1. block the silhouette with flat colour regions (ell / poly / line / px),
  2. shade each region with clean 2–3 tone clusters (light from the top-left),
  3. selective outline: black on the shadow side, a dark local tone on the lit side,
  4. hand-place details (eyes, mouth, tears, highlights) pixel by pixel,
  5. export the finished map as ASCII rows + palette for src/data/sprites/*.js,
     and render a zoomed review PNG next to reference sprites.
The exported map is the asset; this kit only speeds up blocking.
"""
import json, math, sys
from PIL import Image


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[None] * w for _ in range(h)]   # palette key or None
        self.reg = [[None] * w for _ in range(h)]  # region id (for shading/outline)
        self.pal = {}
        self.ramps = {}                             # region → (lit-outline, shadow, base, light) keys

    def color(self, key, hexc):
        self.pal[key] = hexc

    def region(self, rid, base, shadow=None, light=None, line=None, deep=None):
        self.ramps[rid] = dict(base=base, shadow=shadow or base, light=light or base, line=line or 'k', deep=deep or (shadow or base))

    def put(self, x, y, key, rid=None):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y][x] = key
            if rid is not None:
                self.reg[y][x] = rid

    def ell(self, cx, cy, rx, ry, rid, key=None):
        key = key or self.ramps[rid]['base']
        for y in range(self.h):
            for x in range(self.w):
                u, v = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
                if u * u + v * v <= 1.0:
                    self.put(x, y, key, rid)

    def poly(self, pts, rid, key=None):
        key = key or self.ramps[rid]['base']
        for y in range(self.h):
            for x in range(self.w):
                X, Y = x + 0.5, y + 0.5
                c = False
                for i in range(len(pts)):
                    (xa, ya), (xb, yb) = pts[i - 1], pts[i]
                    if (ya > Y) != (yb > Y) and X < (xb - xa) * (Y - ya) / (yb - ya) + xa:
                        c = not c
                if c:
                    self.put(x, y, key, rid)

    def thick(self, pts, r0, r1, rid, key=None):
        """tapered stroke along a polyline"""
        key = key or self.ramps[rid]['base']
        segs = list(zip(pts[:-1], pts[1:]))
        n = len(segs)
        for y in range(self.h):
            for x in range(self.w):
                X, Y = x + 0.5, y + 0.5
                for i, ((xa, ya), (xb, yb)) in enumerate(segs):
                    vx, vy = xb - xa, yb - ya
                    l2 = vx * vx + vy * vy or 1e-6
                    t = max(0, min(1, ((X - xa) * vx + (Y - ya) * vy) / l2))
                    r = r0 + (r1 - r0) * (i + t) / n
                    if math.hypot(X - (xa + vx * t), Y - (ya + vy * t)) <= r:
                        self.put(x, y, key, rid)
                        break

    def line(self, pts, key):
        for (x0, y0), (x1, y1) in zip(pts[:-1], pts[1:]):
            dx, dy = abs(x1 - x0), -abs(y1 - y0)
            sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
            err = dx + dy
            while True:
                self.put(x0, y0, key)
                if x0 == x1 and y0 == y1:
                    break
                e2 = 2 * err
                if e2 >= dy:
                    err += dy; x0 += sx
                if e2 <= dx:
                    err += dx; y0 += sy

    def rows(self, x, y, rows, mapping=None):
        """stamp hand-drawn rows; '.' = skip, ' ' = skip, '_' = erase"""
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch in '. ':
                    continue
                if ch == '_':
                    if 0 <= x + i < self.w and 0 <= y + j < self.h:
                        self.px[y + j][x + i] = None; self.reg[y + j][x + i] = None
                    continue
                self.put(x + i, y + j, mapping.get(ch, ch) if mapping else ch)

    # ---- shading: clean clusters per region (light from top-left)
    def shade(self, rid, shadow=0.62, light=0.28, deep=None):
        cells = [(x, y) for y in range(self.h) for x in range(self.w) if self.reg[y][x] == rid]
        if not cells:
            return
        xs = [c[0] for c in cells]; ys = [c[1] for c in cells]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        R = self.ramps[rid]
        for x, y in cells:
            if self.px[y][x] != R['base']:
                continue
            u = (x - x0 + 0.5) / max(1, x1 - x0 + 1)
            v = (y - y0 + 0.5) / max(1, y1 - y0 + 1)
            d = (u * 0.55 + v * 0.45)
            # distance to the region edge on the lit side gives a rim of light
            if deep is not None and d > deep:
                self.px[y][x] = R['deep']
            elif d > shadow:
                self.px[y][x] = R['shadow']
            elif d < light and self._inner(x, y, rid, 1):
                self.px[y][x] = R['light']

    def _inner(self, x, y, rid, n):
        for dx in range(-n, n + 1):
            for dy in range(-n, n + 1):
                X, Y = x + dx, y + dy
                if not (0 <= X < self.w and 0 <= Y < self.h) or self.reg[Y][X] != rid:
                    return False
        return True

    # ---- selective outline around the whole silhouette + inner lines between regions
    def outline(self, dark='k', inner=True, order=None):
        H, W = self.h, self.w
        src = [r[:] for r in self.px]
        rsrc = [r[:] for r in self.reg]
        for y in range(H):
            for x in range(W):
                if src[y][x] is not None:
                    continue
                nb = None
                lit = False
                for dx, dy, l in ((1, 0, True), (0, 1, True), (-1, 0, False), (0, -1, False)):
                    X, Y = x + dx, y + dy
                    if 0 <= X < W and 0 <= Y < H and src[Y][X] is not None:
                        nb = (X, Y); lit = l
                        break
                if nb is None:
                    continue
                rid = rsrc[nb[1]][nb[0]]
                key = dark
                if lit and rid in self.ramps:
                    key = self.ramps[rid]['line']
                self.px[y][x] = key
                self.reg[y][x] = '_ol'
        if inner and order:
            rank = {r: i for i, r in enumerate(order)}
            for y in range(H):
                for x in range(W):
                    r = rsrc[y][x]
                    if r not in rank:
                        continue
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        X, Y = x + dx, y + dy
                        if 0 <= X < W and 0 <= Y < H:
                            r2 = rsrc[Y][X]
                            if r2 in rank and rank[r2] < rank[r]:
                                self.px[y][x] = self.ramps[r]['line'] if (dx < 0 or dy < 0) else dark
                                break

    # ---- export
    def ascii(self):
        return [''.join(c if c else '.' for c in row) for row in self.px]

    def png(self, path, z=8, bg=(40, 32, 56, 255), extra=None):
        img = Image.new('RGBA', (self.w * z, self.h * z), bg)
        p = img.load()
        for y in range(self.h):
            for x in range(self.w):
                k = self.px[y][x]
                if k and k in self.pal:
                    c = tuple(int(self.pal[k][i:i + 2], 16) for i in (1, 3, 5)) + (255,)
                    for a in range(z):
                        for b in range(z):
                            p[x * z + a, y * z + b] = c
        img.save(path)


def from_ascii(rows, pal):
    c = Canvas(max(len(r) for r in rows), len(rows))
    c.pal = dict(pal)
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch != '.':
                c.px[y][x] = ch
    return c


def review(paths_and_titles, out, z=6, bg=(40, 32, 56, 255)):
    """side-by-side zoomed review sheet of PNG sprites (real refs + ours)"""
    ims = []
    for p in paths_and_titles:
        im = Image.open(p).convert('RGBA')
        bb = im.getbbox()
        if bb:
            im = im.crop((max(0, bb[0] - 2), max(0, bb[1] - 2), min(im.width, bb[2] + 2), min(im.height, bb[3] + 2)))
        ims.append(im.resize((im.width * z, im.height * z), Image.NEAREST))
    W = sum(i.width for i in ims) + 20 * (len(ims) + 1)
    H = max(i.height for i in ims) + 40
    sheet = Image.new('RGBA', (W, H), bg)
    x = 20
    for i in ims:
        sheet.alpha_composite(i, (x, H - 20 - i.height))
        x += i.width + 20
    sheet.save(out)
