# 构建 sockdrive
cd native/sockdrive/js
yarn
yarn run webpack
cd ../../..

EMSDK_VERSION="3.1.68"
EMSDK="$(pwd)/../emsdk"
cd ../emsdk
./emsdk install ${EMSDK_VERSION}
./emsdk activate ${EMSDK_VERSION}
cd ..

BINARYEN_VERSION="version_119_e"
# 下载 Binaryen
wget https://github.com/caiiiycuk/binaryen-fwasm-exceptions/releases/download/${BINARYEN_VERSION}/binaryen-${BINARYEN_VERSION}-arm64-macos.tar.gz

# 解压 Binaryen
tar xfv binaryen-${BINARYEN_VERSION}-x86_64-linux.tar.gz

# 复制 wasm-opt 工具
cp -v binaryen-${BINARYEN_VERSION}/bin/wasm-opt ${EMSDK}/upstream/bin/wasm-opt

mkdir -p build/wasm
cd build/wasm
emcmake cmake -G "Ninja" ../..
ninja -j8 wlibzip
ninja -j8 wdosbox
ninja -j8 wdosbox-x


