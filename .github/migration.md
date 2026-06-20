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

### Compile the wasm project

#### 1 default build scripts via gulp

```bash
source "/Users/a1/sys/emsdk/emsdk_env.sh"
yarn run gulp production # run yarn run gulp if do not want compress js code 
yarn tsc -p .
node build/src/example/basic-node.js # run with javascript
node build/src/example/basic-node.js w # run with javascript worker
```

```bash
yarn run gulp wasm # build the wasm with emsdk ninja
yarn run gulp js # build js code
```

#### 2 using bash

```bash
source "/Users/a1/sys/emsdk/emsdk_env.sh"
mkdir -p build/wasmRelease
cd build/wasmRease
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