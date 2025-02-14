import path from "path";
import { getEmulators, utils } from "../emulators";

const project=path.resolve(__dirname, "..", "..", "..");

const pathPrefix={
    production: path.resolve(project, "dist"),
    product: path.resolve(project, "build/wasm"),
};
const emu=getEmulators(pathPrefix.product);

const TEST_STRING="XDRGS";
const config={
    dosboxConf: `[autoexec]
echo ${TEST_STRING}
`,
    jsdosConf: {
        version: "",
    },
};

async function main() {
    const ci=await emu.dosboxNode(config);
    let stdout="";
    ci.events().onStdout((data)=>{
        stdout+=data; console.log(data);
    });
    for (const code of utils.string2jsdosKey("exit")) {
        await new Promise((resolve)=>setTimeout(resolve, 500));
        ci.simulateKeyPress(...code);
    }
    console.log("============");
    await new Promise((resolve)=>setTimeout(resolve, 2000));
    await ci.exit();
    await new Promise((resolve)=>setTimeout(resolve, 2000));
}

main();
