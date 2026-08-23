import * as assert from "assert";
import { EmulatorsImplNode, BUILTIN } from "../emulators-nodejs";

//
// 1. NOTE: dosbox tests must NOT include `exit` in the autoexec config.
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
// ──────────────────────────────────────────────────────────────────────────────
//
// 2. onUnload is called before onExit
//
// onExit:
//   Interface:  (consumer: () => void) => void   — synchronous
//   Trigger:    ws-exit server message
//   C++ side:   requestExit() → jsdos::requestExit() → main loop detects →
//               runRuntime() → emsc_ws_exit_runtime() → sends ws-exit.
//               Also triggered by Module.uncaught on abnormal termination.
//   JS side:    ws-exit → onExit() → fireExit() → calls all onExitConsumers
//               synchronously (fire-and-forget).
//   Semantic:   Backend is ALREADY dead. Notify listeners for cleanup only.
//
// onUnload:
//   Interface:  (consumer: () => Promise<void>) => void  — async, returns Promise
//   Trigger:    ws-unload server message
//   C++ side:   server_unload() → em_unload() → sends ws-unload and WAITS for
//               wc-unload response before continuing.
//   JS side:    ws-unload → fireUnload() → awaits all onUnloadConsumers Promises
//               → then sends wc-unload back to backend.
//   Semantic:   Backend asks "can I shut down?" → host does async cleanup
//               (persist state, close DB, etc.) → replies "yes, go ahead".
//
// Key difference: onExit = post-mortem notification (sync).
//                 onUnload = shutdown handshake (async, bidirectional).
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

    describe("onUnload callback", () => {
        it("should fire onUnload before onExit (direct)", async () => {
            const ci = await emulators.dosboxXDirect(init, {});
            assert.ok(ci);
            const events = ci.events();
            let unloaded = false;
            let exited = false;
            let unloadBeforeExit = false;
            events.onUnload(async () => {
                unloaded = true;
                if (!exited) {
                    unloadBeforeExit = true;
                }
                // simulate async cleanup
                await new Promise(r => setTimeout(r, 10));
            });
            events.onExit(() => {
                exited = true;
                if (unloaded) {
                    unloadBeforeExit = true;
                }
            });
            await ci.exit();
            assert.ok(unloaded, "onUnload should have been called");
            assert.ok(exited, "onExit should have been called");
            assert.ok(unloadBeforeExit, "onUnload should fire before onExit");
        });
        it("should fire onUnload before onExit (node direct)", async () => {
            const ci = await emulators.dosboxXNodeDirect(init, {}, {});
            assert.ok(ci);
            const events = ci.events();
            let unloaded = false;
            let exited = false;
            let unloadBeforeExit = false;
            events.onUnload(async () => {
                unloaded = true;
                if (!exited) {
                    unloadBeforeExit = true;
                }
                await new Promise(r => setTimeout(r, 10));
            });
            events.onExit(() => {
                exited = true;
                if (unloaded) {
                    unloadBeforeExit = true;
                }
            });
            await ci.exit();
            assert.ok(unloaded, "onUnload should have been called");
            assert.ok(exited, "onExit should have been called");
            assert.ok(unloadBeforeExit, "onUnload should fire before onExit");
        });
        it("should fire onUnload before onExit (worker)", async () => {
            const ci = await emulators.dosboxXWorker(init, {});
            assert.ok(ci);
            const events = ci.events();
            let unloaded = false;
            let exited = false;
            let unloadBeforeExit = false;
            events.onUnload(async () => {
                unloaded = true;
                if (!exited) {
                    unloadBeforeExit = true;
                }
                await new Promise(r => setTimeout(r, 10));
            });
            events.onExit(() => {
                exited = true;
                if (unloaded) {
                    unloadBeforeExit = true;
                }
            });
            await ci.exit();
            assert.ok(unloaded, "onUnload should have been called");
            assert.ok(exited, "onExit should have been called");
            assert.ok(unloadBeforeExit, "onUnload should fire before onExit");
        });
        it("should fire onUnload before onExit (node worker)", async () => {
            const ci = await emulators.dosboxXNodeWorker(init, {}, {});
            assert.ok(ci);
            const events = ci.events();
            let unloaded = false;
            let exited = false;
            let unloadBeforeExit = false;
            events.onUnload(async () => {
                unloaded = true;
                if (!exited) {
                    unloadBeforeExit = true;
                }
                await new Promise(r => setTimeout(r, 10));
            });
            events.onExit(() => {
                exited = true;
                if (unloaded) {
                    unloadBeforeExit = true;
                }
            });
            await ci.exit();
            assert.ok(unloaded, "onUnload should have been called");
            assert.ok(exited, "onExit should have been called");
            assert.ok(unloadBeforeExit, "onUnload should fire before onExit");
        });
    });
});