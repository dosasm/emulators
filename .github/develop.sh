# https://floooh.github.io/2023/11/11/emscripten-ide.html


yarn run tsc -p .
cmake --build build --preset Debug


# Release Mode
cmake --build build --preset Release
