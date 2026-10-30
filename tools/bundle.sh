#!/bin/sh
# One-file playable build (for hosting as a static page): dist/index.html + dist/game.js + dist/assets/audio.
# Needs esbuild (npx esbuild). The page sets window.TOKON_AUDIO_BASE so recorded audio loads beside it.
set -e
cd "$(dirname "$0")/.."
mkdir -p dist
printf "import { VxApp } from '../src/vx/game/app.js';\nnew VxApp().boot().catch((e) => console.error(e));\n" > dist/entry.js
npx --yes esbuild@0.24.2 dist/entry.js --bundle --format=esm --minify --target=es2020 --outfile=dist/game.js
rm dist/entry.js
cp -r assets dist/
sed 's#<script type="module">#<script>window.TOKON_AUDIO_BASE = new URL("assets/audio/", location.href).href;</script>\n<script type="module" src="game.js"></script>\n<script type="module">/*#; s#</script></body>#*/</script></body>#' index.html > dist/index.html
echo "built dist/"
