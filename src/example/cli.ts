import path from "path";
import { getEmulators, utils } from "../emulators";

const project=path.resolve(__dirname, "..", "..", "..");

const pathPrefix={
    production: path.resolve(project, "dist"),
    product: path.resolve(project, "build/wasm"),
};
const emu=getEmulators(pathPrefix.production);

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
    const ci=await emu.dosboxXNode(config);
    let stdout="";
    ci.events().onStdout((data)=>{
        stdout+=data;
        process.stdout.write(data)
    });

    process.stdin.on("data",async (data)=>{
        console.log("input:"+data)
        const codes=utils.string2jsdosKey(String(data)+"\n")
        for (const code of codes){
            ci.simulateKeyPress(...code)
            await new Promise((resolve)=>setTimeout(resolve, 200));
        }
    })   
}

main();
