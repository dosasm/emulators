# Guide to migrate from jsdos's emulators to dosasm project

## Clone the project

```bash
git clone https://github.com/dosasm/emulators/
# or git clone git@github.com:dosasm/emulators.git
```

I recommand to modify `.gitmodules` to use `https` for remote url of submoduel repository.
So edit it, and run following command to compile.

```
git submodule init
git submodule sync # if you changed .gitmodules
git submodule update --depth=1
```

## Compile the project

### Install emsdk

```bash
## for ubuntu
sudo apt-get install -yq --no-install-recommends cmake ninja-build zip # .github/workflows/build.js.yml
## for macos
brew install cmake ninja
```

```bash
cd <a folder>
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk && ./emsdk install 5.0.2 && ./emsdk activate 5.0.2
```

```bash
source "/Users/a1/sys/emsdk/emsdk_env.sh"
npm install -g http-server yarn
yarn
```

### Compile all

```bash
source "/Users/a1/sys/emsdk/emsdk_env.sh"
rm -rf build dist
yarn run gulp production # run yarn run gulp if do not want compress js code 
node build/src/example/basic-node.js # run with javascript
```

```bash
yarn run gulp wasm # build the wasm with emsdk ninja
yarn run gulp js # build js code
```

### compile wasm only

#### 2 using bash

```bash
source "/Users/a1/sys/emsdk/emsdk_env.sh"
mkdir -p build/wasm
cd build/wasm
emcmake cmake -G "Ninja" ../..
ninja -j8 wlibzip
ninja -j8 wdosbox
ninja -j8 wdosbox-x
ninja -j8 wdosbox-x-jspi
cd ../..
```

#### 3 with Debug

```bash
mkdir -p build/wasmDebug
cd build/wasmDebug
emcmake cmake -G "Ninja"  -DCMAKE_BUILD_TYPE=Debug ../..
ninja -j8 wlibzip
ninja -j8 wdosbox
ninja -j8 wdosbox-x
ninja -j8 wdosbox-x-jspi
cd ../..
```


## publish

```
yarn publish --registry https://registry.npmjs.org  --access public
```

---

## Build and run native C++ sokol target

The sokol target builds a native C++ executable using the [sokol-lib](https://github.com/otis-projects/sokol-lib) rendering backend. This is useful for testing on a native machine without a browser or Emscripten.

### Prerequisites

- **macOS**: `brew install cmake ninja sdl2`
- **Linux**: `apt install cmake ninja-build libsdl2-dev`

### Build

```bash
# Create build directory
mkdir -p build/native
cd build/native

# Configure (macOS)
cmake -GNinja -DCMAKE_BUILD_TYPE=Debug \
  -DSDL_NET_INCLUDE_DIR=/opt/homebrew/include/SDL2 \
  -DSDL_NET_LIBRARY="/opt/homebrew/lib/libSDL2_net.dylib" \
  ../..

# Configure (Linux)
cmake -GNinja -DCMAKE_BUILD_TYPE=Debug ../..

# Build
ninja dosbox-sokol
# or for the full DOSBox-X variant:
ninja dosbox-x-sokol
```

### Run

```bash
./build/native/dosbox-sokol
```

### VS Code debug

The project includes a launch configuration `Debug dosbox-sokol` in `.vscode/launch.json` that runs `${workspaceFolder}/build/native/dosbox-sokol`. It uses LLDB (`/usr/bin/lldb`) as the debugger, which is the native macOS debugger and works with Apple Silicon.

### Known issues on macOS

- **OpenGL headers**: The macOS SDK stores OpenGL headers in `OpenGL.framework/Headers/gl.h` but code uses `#include <GL/gl.h>`. A symlink is automatically created during cmake configure to bridge this.
- **Apple Silicon (ARM64)**: The build system auto-detects architecture via `CMAKE_SYSTEM_PROCESSOR`. x86 assembly is disabled on ARM64.
- **SDL_net**: On macOS, `find_package(SDL_net)` looks for SDL_net v1 but Homebrew provides SDL2_net. Pass the include/library paths manually as shown above.