import path from "node:path";
import { EmulatorsImplNode, get_builtin_dist, CommandInterface } from "../emulators-nodejs";
import { Shell } from "../utils/shell";
import fs from "node:fs";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  options: {
    method:{
        type:"string",
        short:"d",
        default:"dosboxXNodeWorker"
    },
    verbose: {
      type: 'boolean',
      short: 'v',
    },
    mount: {
      type: 'string',
      short: 'm',
    },
  },
  allowPositionals: true,
});



const config={
    dosboxConf: `[autoexec]
mount c .
c:
dir
`,
    jsdosConf: {
        version: "",
    },
};

async function main() {
    // console.log('Values:', values);
    // console.log('Positionals:', positionals);
    let mounts:Record<string,string>={};
    if (values.mount){
        let ms=values.mount.split(";")
        for(const m of ms){
            const [inEmu,inHost]=m.split(":")
            mounts[inHost]=inEmu;
        }

    }
    const logFile = path.resolve(__dirname, "message.txt");

    console.log(process.argv, "logging to ", logFile);

    let BUILTIN=get_builtin_dist();
    let pathPrefix=BUILTIN.production;
    if (process.argv.length>3&& process.argv[3]==="dev") {
        pathPrefix=BUILTIN.development;
    }

    const emu=new EmulatorsImplNode();
    emu.pathPrefix=pathPrefix;
    fs.writeFileSync(logFile, `emulators wasm loaded from ${pathPrefix}
emulated by ${values.method}
`);

    let ci:CommandInterface|undefined=undefined;
    switch(values.method){
        case "dosboxDirect":
            ci=await emu.dosboxDirect(config,{});
            break
        case "dosboxXDirect":
            ci=await emu.dosboxXDirect(config,{});
            break
        case "dosboxWorker(":
            ci=await emu.dosboxWorker(config,{});
            break;
        case "dosboxXWorker":
            ci=await emu.dosboxXWorker(config,{});
            break;
        case "dosboxXNodeDirect":
            ci=await emu.dosboxXNodeDirect(config,{},mounts)
            break;
        case "dosboxNodeDirect":
            ci=await emu.dosboxNodeDirect(config,{},mounts)
            break
        case "dosboxXNodeWorker":
            ci=await emu.dosboxXNodeWorker(config,{},mounts)
            break
        case "dosboxNodeWorker":
            ci=await emu.dosboxNodeWorker(config,{},mounts)
            break
        default:
            console.log(values.method,"not allowed")
    }
    
    if(ci===undefined){
        console.log("start failed")
        return
    }

    // output dos stdout to terminal
    ci.events().onStdout((data)=>{
        process.stdout.write(data);
    });
    ci.events().onMessage((msg)=>{
        fs.appendFile(logFile, msg+"\n", ()=>{});
    });
    const shell=new Shell(ci);
    await shell.wait_prompt();
    process.stdin.on("data", async (data)=>{
        const cmd=data.toString("ascii");
        if (cmd.trim().toLowerCase()==="exit") {
            process.exit();
        }
        // console.log("exec:"+cmd)
        await shell.exec(cmd);
        // console.log("result:"+out);
    });
}

main();
