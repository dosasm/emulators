import { string2jsdosKey } from "./string2jsdoskey";
import { CommandInterface } from "../emulators";

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

type RUNNING={
    cmd: string,
    resolve: ((out: string) => void),
    reject: ((out: string) => void),
    idx: number
}

export class Shell {
    running: RUNNING| undefined = undefined;
    stdout: string[] = [];
    constructor(public ci: CommandInterface) {
        ci.events().onStdout((data) => {
            this.stdout.push(data);
            if (data.endsWith(">") && this.running) {
                const out = this.stdout.slice(this.running.idx).join("");
                this.running.resolve(out);
            }
        });
    }

    public get is_prompt() {
        if (this.stdout.length==0) {
            return false;
        }
        return this.stdout[this.stdout.length - 1].endsWith(">");
    }

    public async wait_prompt(ms=200, max=100) {
        let count=0;
        while (!this.is_prompt) {
            if (this.stdout.length==0) {
                this.ci.simulateKeyPress(257);
            }
            await sleep(ms);
            count++;
            if (count>max) {
                break;
            }
        }
    }

    /**
     * execute one cmd in the JSBox
     * command are send via key event so the this function may not work as expected
     * for we do not check the status of JSBox
     * @param {string} cmd - command to execute
     * @param {number} wait1 - delay before sending command
     * @param {number} wait2 - delay between key presses
     * @param {number} timeout - max wait time for command output
     */
    async exec(cmd: string, wait1 = 500, wait2 = 100, timeout = 10000) {
        if (this.running) {
            this.running.reject("another cmd sended");
        }
        await sleep(wait1);
        const out = new Promise((resolve, reject) => {
            this.running = {
                cmd, resolve, reject,
                idx: this.stdout.length,
            };
            setTimeout(() => {
                if (!this.running) return;
                const out = this.stdout.slice(this.running.idx).join("");
                this.running.resolve(out);
            }, timeout);
        });
        for (const code of string2jsdosKey(cmd, false, true)) {
            this.ci.simulateKeyPress(...code);
            await sleep(wait2);
        }
        return out;
    }
}

