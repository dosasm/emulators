sudo apt-get -yqq update
sudo apt-get install -yq --no-install-recommends cmake ninja-build zip


source  ".github/tmp/emsdk/emsdk_env.sh"
npm install -g yarn




if node .github/emsdk.js; then
    echo "node .github/emsdk.js 执行成功"
else
    echo "node .github/emsdk.js 执行失败，EMSDK 失败"
    exit 1
fi



mkdir -p build/wasm
cd build/wasm
emcmake cmake -G "Ninja" ../..
ninja -j8 wlibzip
ninja -j8 wdosbox
ninja -j8 wdosbox-x
cd ../..
node .github/worker.js

