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


    
    const cmds=["mount c .","c:","echo ~!@#$%^&*()_+","echo 1234567890-="]
    const shell=new Shell(ci)
    while(!shell.is_prompt){
        await utils.sleep(200)
    }
    for (const cmd of cmds){
        await utils.sleep(200)
        console.log("exec command",cmd)
        const out=await shell.exec(cmd)
        console.log("exec result:",out);
    }
    
    await utils.sleep(300)
    await ci.exit();
    
    console.log(stdout)
    process.exit()
}

main();
