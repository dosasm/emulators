import { string2jsdosKey } from "./string2jsdoskey"
import { CommandInterface } from "../emulators"

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

type RUNNING={
    cmd: string, 
    resolve: ((out: string) => void), 
    reject: ((out: string) => void), 
    idx: number
}

export class Shell {
    running: RUNNING| undefined = undefined
    stdout: string[] = []
    constructor(public ci: CommandInterface) {
        ci.events().onStdout(data => {
            this.stdout.push(data)
            if (data.endsWith(">") && this.running) {
                let out = this.stdout.slice(this.running.idx).join("");
                this.running.resolve(out)
            }
        })
    }

    public get is_prompt() {
        if(this.stdout.length==0){
            return false
        }
        return this.stdout[this.stdout.length - 1].endsWith(">")
    }

    /**
     * execute one cmd in the JSBox
     * command are send via key event so the this function may not work as expected 
     * for we do not check the status of JSBox
     * @param cmd 
     * @param wait1 
     * @param wait2 
     * @param timeout 
     * @returns 
     */
    async exec(cmd: string, wait1 = 500, wait2 = 100, timeout = 10000) {
        if (this.running){
            this.running.reject("another cmd sended")
        }
        await sleep(wait1)
        const out = new Promise((resolve, reject) => {
            this.running = {
                cmd, resolve, reject,
                idx: this.stdout.length
            }
            setTimeout(() => {
                reject(cmd + " timeout")
            }, timeout);
        })
        for (const code of string2jsdosKey(cmd, false, true)) {
            this.ci.simulateKeyPress(...code);
            await sleep(wait2)
        }
        return out
    }
}

