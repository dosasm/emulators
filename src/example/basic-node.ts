import path from "path";
import { getEmulators, utils } from "../emulators";
import { Shell } from "../utils/shell";

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
        stdout+=data; console.log(data);
    });

    await new Promise((resolve)=>setTimeout(resolve, 2000));
    const cmds=["echo hello nodejs","echo nice to meet you"]
    const shell=new Shell(ci)
    for (const cmd of cmds){
        await new Promise((resolve)=>setTimeout(resolve, 100));
        console.log("exec command",cmd)
        const out=await shell.exec(cmd)
        console.log("exec result:",out);
    }
    
    await new Promise((resolve)=>setTimeout(resolve, 2000));
    await ci.exit();
    await new Promise((resolve)=>setTimeout(resolve, 2000));
    console.log(stdout)
}

main();
