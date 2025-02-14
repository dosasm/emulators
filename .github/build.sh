#!/bin/bash


NODE_VERSION="18.x"
EMSDK_VERSION="3.1.68"
BINARYEN_VERSION="version_119_e"
PROJECT_FOLDER="$(dirname $0)/../../"

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
yarn run eslint src --ext ts,tsx --max-warnings 0
yarn run eslint test --ext ts,tsx --max-warnings 0

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


# 激活 Emscripten 环境并构建生产版本
yarn run gulp production


yarn mocha test/nodejs/main.js

# 压缩发布文件
zip -9r release.zip dist/*
