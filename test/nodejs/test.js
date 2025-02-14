const path=require("path")

const { getEmulators,utils } =require("../../build/src/emulators")
const emu=getEmulators()
// emu.pathPrefix=path.resolve(__dirname,"..","..","dist")
// emu.pathPrefix=path.resolve(__dirname,"..","..","build/wasm")
emu.pathPrefix=path.resolve(__dirname,"..","..","build/Debug")


const TEST_STRING="XDRGS"
const config={
    dosboxConf: `[autoexec]
echo ${TEST_STRING}
`,
    jsdosConf: {
        version: "",
    },
};

async function main(){
    const ci=await emu.dosboxNode(config);
    let stdout="";
    ci.events().onStdout(data=>{stdout+=data;console.log(data)})
    for (const code of utils.String2jsdosCode("exit")){
        await new Promise(resolve=>setTimeout(resolve,500))
        ci.simulateKeyPress(...code)
    }
    await new Promise(resolve=>setTimeout(resolve,2000))
    await ci.exit()
}

main()
