const cp = require("child_process")
const os = require("os")

NODE_VERSION = "18.x"
EMSDK_VERSION = "3.1.68"
BINARYEN_VERSION = "version_119_e"

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
    return "https://github.com/caiiiycuk/binaryen-fwasm-exceptions/releases/download/" + getBinaryenFile()
}

function main() {
    // console.log(process.argv)
    if (process.argv.includes("opt")) {
        const url = binaryen()
        console.log(url)
    } else {
        if ("EMSDK" in process.env) {
            console.log("installed at ", process.env["EMSDK"])
            process.exit(0)
        } else {
            process.exit(1)
        }

    }

}

main()

