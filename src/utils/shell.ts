import { string2jsdosKey } from "./string2jsdoskey"
import { CommandInterface } from "../emulators"

function sleep(ms:number){
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export class Shell {
    to_listen:{resolve:(stdout:string)=>void,cmd:string,sended?:number,resolved?:boolean}[] = []
    stdout:string[]=[]
    constructor(public ci: CommandInterface) {
        ci.events().onStdout(data => {
            this.stdout.push(data)
            for(const l of this.to_listen){
                if(l.resolved) continue
                if(l.sended===undefined)l.sended=this.stdout.length
                if (data.endsWith("\\>")) {
                    let out=this.stdout.slice(l.sended).join("");
                    l.resolve(out)
                    l.resolved=true
                }
            }
        })
    }

    wait_stdout(cmd: string) {
        return new Promise((resolve, reject) => {
            this.to_listen.push({resolve,cmd,sended:this.stdout.length})
        })
    }

    async exec(cmd: string,wait1=500,wait2=100) {
        let out = this.wait_stdout(cmd)
        await sleep(wait1)
        for (const code of string2jsdosKey(cmd + "\n")) {
            this.ci.simulateKeyPress(...code);
            await sleep(wait2)
        }
        return out
    }
}

