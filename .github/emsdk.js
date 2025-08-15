const fs = require("fs")
const os = require("os")
const path=require("path")

const NODE_VERSION = "18.x"
const EMSDK_VERSION = "3.1.68"
const BINARYEN_VERSION = "version_119_e"

const TMPDIR=path.resolve(".github/tmp/")

function installSDK() {
    const text=`
cd ${TMPDIR}
git clone --depth=1 https://github.com/emscripten-core/emsdk
cd emsdk
./emsdk install "${EMSDK_VERSION}"
./emsdk activate --embedded  "${EMSDK_VERSION}"`
    const out=path.join(TMPDIR,"emsdk.sh")
    fs.writeFileSync(out,text)
    return out
}

function getBinaryenFile() {
    const platform = os.platform();
    const arch = os.arch();

    switch (platform) {
        case 'linux':
            if (arch === 'aarch64') {
                return `binaryen-${BINARYEN_VERSION}-aarch64-linux.tar.gz`;
            } else if (arch === 'x64') {
                return `binaryen-${BINARYEN_VERSION}-x86_64-linux.tar.gz`;
            }
            break;
        case 'darwin':
            if (arch === 'arm64') {
                return `binaryen-${BINARYEN_VERSION}-arm64-macos.tar.gz`;
            } else if (arch === 'x64') {
                return `binaryen-${BINARYEN_VERSION}-x86_64-macos.tar.gz`;
            }
            break;
        case 'win32':
            // 列表中没有 Windows 相关文件，可根据实际情况添加逻辑
            console.log('当前提供的文件列表中没有适用于 Windows 的文件');
            return null;
        default:
            console.log('不支持的操作系统');
            return null;
    }
    console.log('未找到适合当前系统架构的文件');
    return null;
}

function binaryen() {
    return "https://github.com/caiiiycuk/binaryen-fwasm-exceptions/releases/download/"+BINARYEN_VERSION+"/" + getBinaryenFile()
}

function installBinaryen(EMSDK) {
    const text=`
cd ${TMPDIR}
wget ${binaryen()}
tar xfv ${getBinaryenFile()}
cp -v binaryen-${BINARYEN_VERSION}/bin/wasm-opt ${EMSDK}/upstream/bin/wasm-opt
cp -v binaryen-${BINARYEN_VERSION}/lib/libbinaryen.dylib ${EMSDK}/upstream/lib/libbinaryen.dylib
`
    const out=path.resolve(TMPDIR,"binaryen.sh");
    fs.writeFileSync(out,text)
    return out
}

function main() {
    if (!fs.existsSync(TMPDIR))
        fs.mkdirSync(TMPDIR,{recursive:true})

    const EMSDK=process.env["EMSDK"]
    const s1=installSDK()

    if (!EMSDK) {
        console.error("请设置 EMSDK 环境变量")
        console.error("请运行 "+s1+" 脚本")
        process.exit(1)
    }
    const s2=installBinaryen(EMSDK)
    console.log("请运行 "+s2+" 脚本")
}

main()

