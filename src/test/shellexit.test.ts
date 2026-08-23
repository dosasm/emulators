import { emulators } from './../../gulpfile.ts/emulators';
import * as assert from "assert";
import { CommandInterface, EmulatorsImplNode, get_builtin_dist } from "../emulators-nodejs";
import { Shell } from "../utils/shell";

const randomString = "dosasmtest"

describe("Shell echo and exit test", function (this: Mocha.Suite) {
    this.timeout(20000);
    let emulators: EmulatorsImplNode;

    const init = {
        dosboxConf: `[autoexec]
echo ${randomString}
    `,
        jsdosConf: {
            version: "",
        },
    };

    beforeEach(() => {
        emulators = new EmulatorsImplNode();
        emulators.pathPrefix = get_builtin_dist().production;
    });

    describe("shell exec & exit test", () => {
        async function test_ci(funcname:string) {
            const ci = await (emulators as any)[funcname](init, {}) as CommandInterface;
            assert.ok(ci);
            const events = ci.events();
            let message = "";
            let stdout = "";
            events.onMessage((msgType, ...args: any[]) => message += `[${msgType}] ${args}`);
            events.onStdout((msg) => stdout += msg);

            const randomStringPromise = new Promise<boolean>(resolve => {
                if (stdout.includes(randomString)) {
                    resolve(true);
                    return;
                }
                events.onStdout(data => {
                    if (stdout.includes(randomString)) {
                        resolve(true)
                    }
                })
            })
            await randomStringPromise;
   
            const shell = new Shell(ci);
            const ExitedCalledPromise=new Promise<boolean>((resolve)=>{
                events.onExit(()=>{resolve(true)})
                setTimeout(() => {
                    resolve(false)
                }, 1000);
            })
            await shell.exec("exit").catch(console.error);
            const onExitCalled=await ExitedCalledPromise;
            assert.ok(ci.exited, message + stdout);
        }

        const funcs = [
            "dosboxXDirect",
            "dosboxXWorker",
            "dosboxDirect",
            "dosboxWorker",
        ];

        for (const func of funcs) {
            it(`should exit using emulators.${func}`, async () => { 
                await test_ci(func)
            });
        }
    });
});