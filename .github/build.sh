#!/bin/bash


NODE_VERSION="18.x"
EMSDK_VERSION="3.1.68"
BINARYEN_VERSION="version_119_e"
PROJECT_FOLDER="$(dirname $0)/../"
cd $PROJECT_FOLDER
PROJECT_FOLDER=$(pwd)

# check or install emsdk
if [ -z "$EMSDK" ]; then

    INSTALL_DIR="$PROJECT_FOLDER/../emsdk"
    if [ ! -d "$INSTALL_DIR" ]; then
        git clone https://github.com/emscripten-core/emsdk.git "$INSTALL_DIR"
        if [ $? -ne 0 ]; then
            echo "clone failed"
            exit 1
        fi
    fi

    cd "$INSTALL_DIR"

    ./emsdk install ${EMSDK_VERSION}
    if [ $? -ne 0 ]; then
        echo "install emsdk ${EMSDK_VERSION} failed"
        exit 1
    fi

    ./emsdk activate ${EMSDK_VERSION}
    if [ $? -ne 0 ]; then
        echo "activate ${EMSDK_VERSION} failed"
        exit 1
    fi

    # 加载 emsdk 环境变量
    source ./emsdk_env.sh
    echo "source file $(pwd)/emsdk_env.sh"
    if [ $? -ne 0 ]; then
        exit 1
    fi

    cd -
else
    echo "已检测到 EMSDK 环境变量，无需安装。"
fi


# 更新系统包列表
sudo apt-get -yqq update

# 安装必要的系统依赖
sudo apt-get install -yq --no-install-recommends cmake ninja-build zip

# 安装项目依赖
yarn

# 运行 ESLint 检查
yarn run eslint src --ext ts,tsx --max-warnings 0 --fix
yarn run eslint test --ext ts,tsx --max-warnings 0 --fix

# 运行 TypeScript 编译检查
yarn run tsc --noemit

# 构建 sockdrive
cd native/sockdrive/js
yarn
yarn run webpack
cd ../../..

# 检查文件是否存在
if [ -f "${EMSDK}/upstream/bin/wasm-opt" ]; then
    echo "binaryen installed"
else
    # 下载 Binaryen
    wget https://github.com/caiiiycuk/binaryen-fwasm-exceptions/releases/download/${BINARYEN_VERSION}/binaryen-${BINARYEN_VERSION}-x86_64-linux.tar.gz

    # 解压 Binaryen
    tar xfv binaryen-${BINARYEN_VERSION}-x86_64-linux.tar.gz

    # 复制 wasm-opt 工具
    cp -v binaryen-${BINARYEN_VERSION}/bin/wasm-opt ${EMSDK}/upstream/bin/wasm-opt
fi


rm -rf dist
# rm -rf build

# option1 original build
yarn run gulp production

# # option2 build with shell for better understanding
# # PROJECT_FOLDER=$(pwd)
# emcmake cmake -GNinja -DCMAKE_BUILD_TYPE=Release $PROJECT_FOLDER
# ninja -j2 wlibzip
# ninja -j2 wdosbox
# ninja -j2 wdosbox-x

yarn tsc --declaration "src/emulators.ts"  --outDir "dist/out"
yarn mocha test/nodejs/main.js

# 压缩发布文件
yarn pack
