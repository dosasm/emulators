import * as assert from "assert";
import { EmulatorsImplNode, BUILTIN } from "../emulators-nodejs";

//
// NOTE: dosbox tests must NOT include `exit` in the autoexec config.
//
// Root cause: The dosbox WASM build includes "main" in its asyncify whitelist
// (targets/dosbox-asyncify.txt), which causes emscripten_exit_with_live_runtime()
// to malfunction — the WASM runtime exits immediately after main() returns,
// before bundles can be sent to the backend. This results in:
//   ExitStatus { message: "Program terminated with exit(0)", status: 0 }
//
// dosbox-x does NOT have "main" in its asyncify whitelist, so it works fine
// with `exit` in autoexec.
//
// Workaround: omit `exit` from dosbox autoexec; let ci.exit() handle cleanup.
//

describe("emulators core dosbox", () => {
    let emulators: EmulatorsImplNode;

    const init = {
        dosboxConf: `[autoexec]
dir
    `,
        jsdosConf: {
            version: "",
        },
    };

    beforeEach(() => {
        emulators = new EmulatorsImplNode();
        emulators.pathPrefix = BUILTIN.production;
    });

    describe("Exit via direct mode", () => {
        it("should exit using dosboxDirect", async () => {
            const ci = await emulators.dosboxDirect(init, {});
            assert.ok(ci);
            const events = ci.events();
            let message = "";
            let stdout = "";
            events.onMessage((msgType, ...args: any[]) => message += `[${msgType}] ${args}`);
            events.onStdout((msg) => stdout += msg);
            let exited = false;
            events.onExit(() => { exited = true; });
            await ci.exit();
            assert.ok(exited, message + stdout);
        });
        it("should exit using dosboxNodeDirect", async () => {
            const ci = await emulators.dosboxNodeDirect(init, {}, {});
            assert.ok(ci);
            const events = ci.events();
            let message = "";
            let stdout = "";
            events.onMessage((msgType, ...args: any[]) => message += `[${msgType}] ${args}`);
            events.onStdout((msg) => stdout += msg);
            let exited = false;
            events.onExit(() => { exited = true; });
            await ci.exit();
            assert.ok(exited, message + stdout);
        });
    });

    describe("Exit via worker mode", () => {
        it("should exit using dosboxWorker", async () => {
            const ci = await emulators.dosboxWorker(init, {});
            assert.ok(ci);
            const events = ci.events();
            let message = "";
            let stdout = "";
            events.onMessage((msgType, ...args: any[]) => message += `[${msgType}] ${args}`);
            events.onStdout((msg) => stdout += msg);
            let exited = false;
            events.onExit(() => { exited = true; });
            await ci.exit();
            assert.ok(exited, message + stdout);
        });
        it("should exit using dosboxNodeWorker", async () => {
            const ci = await emulators.dosboxNodeWorker(init, {}, {});
            assert.ok(ci);
            const events = ci.events();
            let message = "";
            let stdout = "";
            events.onMessage((msgType, ...args: any[]) => message += `[${msgType}] ${args}`);
            events.onStdout((msg) => stdout += msg);
            let exited = false;
            events.onExit(() => { exited = true; });
            await ci.exit();
            assert.ok(exited, message + stdout);
        });
    });
});

describe("emulators core dosbox-x", () => {
    let emulators: EmulatorsImplNode;

    const init = {
        dosboxConf: `[autoexec]
dir
exit
    `,
        jsdosConf: {
            version: "",
        },
    };

    beforeEach(() => {
        emulators = new EmulatorsImplNode();
        emulators.pathPrefix = BUILTIN.production;
    });

    describe("Exit via direct mode", () => {
        it("should exit using dosboxXDirect", async () => {
            const ci = await emulators.dosboxXDirect(init, {});
            assert.ok(ci);
            const events = ci.events();
            let message = "";
            let stdout = "";
            events.onMessage((msgType, ...args: any[]) => message += `[${msgType}] ${args}`);
            events.onStdout((msg) => stdout += msg);
            let exited = false;
            events.onExit(() => { exited = true; });
            await ci.exit();
            assert.ok(exited, message + stdout);
        });
        it("should exit using dosboxXNodeDirect", async () => {
            const ci = await emulators.dosboxXNodeDirect(init, {}, {});
            assert.ok(ci);
            const events = ci.events();
            let message = "";
            let stdout = "";
            events.onMessage((msgType, ...args: any[]) => message += `[${msgType}] ${args}`);
            events.onStdout((msg) => stdout += msg);
            let exited = false;
            events.onExit(() => { exited = true; });
            await ci.exit();
            assert.ok(exited, message + stdout);
        });
    });

    describe("Exit via worker mode", () => {
        it("should exit using dosboxXWorker", async () => {
            const ci = await emulators.dosboxXWorker(init, {});
            assert.ok(ci);
            const events = ci.events();
            let message = "";
            let stdout = "";
            events.onMessage((msgType, ...args: any[]) => message += `[${msgType}] ${args}`);
            events.onStdout((msg) => stdout += msg);
            let exited = false;
            events.onExit(() => { exited = true; });
            await ci.exit();
            assert.ok(exited, message + stdout);
        });
        it("should exit using dosboxXNodeWorker", async () => {
            const ci = await emulators.dosboxXNodeWorker(init, {}, {});
            assert.ok(ci);
            const events = ci.events();
            let message = "";
            let stdout = "";
            events.onMessage((msgType, ...args: any[]) => message += `[${msgType}] ${args}`);
            events.onStdout((msg) => stdout += msg);
            let exited = false;
            events.onExit(() => { exited = true; });
            await ci.exit();
            assert.ok(exited, message + stdout);
        });
    });
});