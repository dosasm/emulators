# https://floooh.github.io/2023/11/11/emscripten-ide.html
yarn run tsc -p .

PROJECT_FOLDER="$(dirname $0)/../"
cd $PROJECT_FOLDER

emcmake cmake -GNinja -DCMAKE_BUILD_TYPE=Debug $(pwd)
ninja -j2 wlibzip
ninja -j2 wdosbox
ninja -j2 wdosbox-x