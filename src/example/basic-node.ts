import { getEmulators, utils,BUILTIN } from "../emulators-nodejs";
import { Shell } from "../utils/shell";

const emu=getEmulators(BUILTIN.development);

const config={
    dosboxConf: `[autoexec]
echo hello
`,
    jsdosConf: {
        version: "",
    },
};

async function main() {
    const ci=await emu.dosboxDirect(config);
    let stdout="";
    ci.events().onStdout((data)=>{
        stdout+=data; 
        process.stdout.write(data)
    });
    const shell=new Shell(ci)
    await shell.wait_prompt();
    process.stdin.on("data",async data=>{
        const cmd=data.toString('ascii')
        if(cmd.trim().toLowerCase()==="exit"){
            await ci.exit()
            process.exit()
        }
        // console.log("exec:"+cmd)
        const out=await shell.exec(cmd)
        // console.log("result:"+out);
    })
}

main();
