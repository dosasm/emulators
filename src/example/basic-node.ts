import path from "node:path";
import { getEmulators, utils,BUILTIN,platform } from "../emulators-nodejs";
import { Shell } from "../utils/shell";
import fs from "node:fs"



const config={
    dosboxConf: `[autoexec]
echo hello
`,
    jsdosConf: {
        version: "",
    },
};

async function main() {
    const log_file=path.resolve(__dirname,"message.txt");
    console.log(process.argv,"logging to ",log_file)
    
    let pathPrefix=BUILTIN.production;
    if (process.argv.length>3&& process.argv[3]==="dev"){
        pathPrefix=BUILTIN.development;
    }
    const emu=getEmulators(pathPrefix);

    const funcs={
        "d":emu.dosboxDirect,
        "xd":emu.dosboxXDirect,
        "w":emu.dosboxWorker,
        "xw":emu.dosboxXWorker,
    }
    let func=emu.dosboxDirect;
    for (const [name,func_] of Object.entries(funcs)){
        if(process.argv.length>2 && process.argv[2]===name){
            func=func_;
        }
    }
    fs.writeFileSync(log_file,`emulators wasm loaded from ${pathPrefix}
emulated by ${func}
`)

    const ci=await func.call(emu,config).catch(e=>{
        console.log(e);
        throw new Error()
    });

    // output dos stdout to terminal
    let stdout="";
    ci.events().onStdout((data)=>{
        stdout+=data; 
        process.stdout.write(data)
    });
    ci.events().onMessage(msg=>{
        fs.appendFile(log_file,msg+"\n",()=>{})
    })
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
