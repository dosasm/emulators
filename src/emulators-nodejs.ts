import { EmulatorsImpl } from './impl/emulators-impl';
export * from "./emulators";
import { Platform, platform, XhrOptions } from "./impl/platform";
import { Worker as NodeWorker } from "node:worker_threads";

import { WasmModule, IWasmModules, loadWasmModule } from "./impl/modules";
import { BackendOptions, CommandInterface, InitFs } from "./emulators";
import { TransportLayer, MessageHandler, ClientMessage, ServerMessage, Net } from "./protocol/protocol";
import { MessagesQueue } from "./protocol/messages-queue";
import { dosWorker } from "./dos/dosbox/ts/worker";

export class NodeJs implements Platform {
    name = "nodejs";
    httpRequest(url: string, options: XhrOptions): Promise<string> {
        return new Promise((resolve, reject) => {
            const http = require("node:http");
            const https = require("node:https");
            const urlObj = new URL(url);
            const requestOptions = {
                method: options.method,
                protocol: urlObj.protocol,
                hostname: urlObj.hostname,
                port: urlObj.port,
            };
            const req = (urlObj.protocol === "https:" ? https : http).request(urlObj, requestOptions, (res: any) => {
                let data = "";
                res.on("data", (chunk: any) => {
                    data += chunk;
                });
                res.on("end", () => {
                    resolve(data);
                });
            });
            req.on("error", (e: any) => {
                reject(e);
            },
            );
        });
    }
    node_require(path: string) {
        return require(path);
    }
    createWorker(workerUrl: string, onerror: (e: ErrorEvent) => void,
        onmessage: (e: MessageEvent) => void): Promise<Worker> {
        const w = new NodeWorker(workerUrl);
        w.on("message", (message: any) => {
            onmessage({ data: message } as any);
        });
        w.on("error", (error: any) => {
            onerror({ type: "node worker thread", filename: error.stack, message: error.message } as any);
        });
        return Promise.resolve(w as unknown as Worker);
    }
}

platform.current = new NodeJs();

// NODEFS-specific WASM module names
const NODEFS_WDOSBOX_JS = "wdosbox-nodefs.js";
const NODEFS_WDOSBOXX_JS = "wdosbox-x-nodefs.js";

/**
 * NODEFS mount configuration.
 * Keys are host filesystem paths (absolute or relative).
 * Values are the corresponding subpaths under /home/web_user in the WASM filesystem.
 *
 * Example:
 *   { "/data/games": "games", "/data/saves": "saves" }
 *   mounts host /data/games → /home/web_user/games
 *   mounts host /data/saves → /home/web_user/saves
 */
export type NodeMounts = { [hostPath: string]: string };

class NodeFsWasmModules implements IWasmModules {
    private pathPrefix: string;
    private pathSuffix: string;
    private wdosboxxJsJspi: string;

    private libzipPromise?: Promise<WasmModule>;
    private dosboxPromise?: Promise<WasmModule>;
    private dosboxxPromise?: Promise<WasmModule>;
    private dosboxxJspiPromise?: Promise<WasmModule>;

    constructor(pathPrefix: string, pathSuffix: string, wdosboxxJsJspi: string) {
        this.pathPrefix = pathPrefix;
        this.pathSuffix = pathSuffix;
        this.wdosboxxJsJspi = wdosboxxJsJspi;
    }

    libzip() {
        if (this.libzipPromise !== undefined) {
            return this.libzipPromise;
        }
        this.libzipPromise = loadWasmModule(
            this.pathPrefix + "wlibzip.js" + this.pathSuffix, "WLIBZIP", () => {});
        return this.libzipPromise;
    }

    dosbox() {
        if (this.dosboxPromise !== undefined) {
            return this.dosboxPromise;
        }
        this.dosboxPromise = loadWasmModule(
            this.pathPrefix + NODEFS_WDOSBOX_JS + this.pathSuffix, "WDOSBOXNODEFS", () => {});
        return this.dosboxPromise;
    }

    dosboxx() {
        if (this.dosboxxPromise !== undefined) {
            return this.dosboxxPromise;
        }
        this.dosboxxPromise = loadWasmModule(
            this.pathPrefix + NODEFS_WDOSBOXX_JS + this.pathSuffix, "WDOSBOXXNODEFS", () => {});
        return this.dosboxxPromise;
    }

    dosboxxJspi() {
        if (this.dosboxxJspiPromise !== undefined) {
            return this.dosboxxJspiPromise;
        }
        this.dosboxxJspiPromise = loadWasmModule(
            this.pathPrefix + this.wdosboxxJsJspi + this.pathSuffix, "WDOSBOXXJSPI", () => {});
        return this.dosboxxJspiPromise;
    }
}

/**
 * Run DOSBox/DOSBox-X WASM directly in the current Node.js process with NODEFS support.
 * After WASM instantiation, mounts host directories into the WASM filesystem.
 */
async function dosNodeDirect(wasmModule: WasmModule,
                             sessionId: string,
                             mounts?: NodeMounts,
                             net?: Net): Promise<TransportLayer> {
    const messagesQueue = new MessagesQueue();
    let handler: MessageHandler = messagesQueue.handler.bind(messagesQueue);

    const module: any = {};

    module.postMessage = (name: ServerMessage, props: { [key: string]: any }) => {
        handler(name, props);
    };

    const transportLayer: TransportLayer = {
        sessionId,
        sendMessageToServer: (name: ClientMessage, props?: { [key: string]: any }) => {
            module.messageHandler({ data: { name, props } });
        },
        initMessageHandler: (newHandler: MessageHandler) => {
            handler = newHandler;
            messagesQueue.sendTo(handler);
        },
        exit: () => {
            // no-op for node direct mode (no window event listeners to clean up)
        },
        net: net ?? null,
    };

    (transportLayer as any).module = module;

    await wasmModule.instantiate(module);

    // Mount NODEFS host directories into the WASM filesystem
    if (mounts && module.FS) {
        const nodeFs = require("node:fs");
        const nodePath = require("node:path");

        const HOME = "/home/web_user";

        // Ensure the base mount point exists
        try {
            module.FS.mkdir(HOME);
        } catch (e) {
            // already exists
        }

        for (const hostPath of Object.keys(mounts)) {
            const subPath = mounts[hostPath];
            const resolvedRoot = nodePath.resolve(hostPath);

            // Ensure the host directory exists
            if (!nodeFs.existsSync(resolvedRoot)) {
                nodeFs.mkdirSync(resolvedRoot, { recursive: true });
            }

            // Create each intermediate directory in the WASM path
            const wasmMountPath = HOME + "/" + subPath;
            const parts = wasmMountPath.split("/").filter(Boolean);
            let current = "";
            for (const part of parts) {
                current += "/" + part;
                try {
                    module.FS.mkdir(current);
                } catch (e) {
                    // already exists
                }
            }

            module.FS.mount(module.FS.filesystems.NODEFS, { root: resolvedRoot }, wasmMountPath);
        }

        module.FS.chdir(HOME);
    }

    module.callMain([sessionId]);

    return transportLayer;
}

export class EmulatorsImplNode extends EmulatorsImpl {
    private nodeModules?: NodeFsWasmModules;

    private nodeWasmModules(): NodeFsWasmModules {
        if (this.nodeModules !== undefined) {
            return this.nodeModules;
        }
        this.nodeModules = new NodeFsWasmModules(
            this.pathPrefix,
            this.pathSuffix,
            this.wdosboxxJsJspi,
        );
        return this.nodeModules;
    }

    /**
     * Create a DOSBox instance using NODEFS, running directly in the current process.
     * @param init - initialization data (bundle, files, or config)
     * @param options - backend options
     * @param mounts - NODEFS mount configuration: { [hostPath]: "subpath under /home/web_user" }
     */
    async dosboxNodeDirect(init: InitFs, options?: BackendOptions,
                           mounts?: NodeMounts): Promise<CommandInterface> {
        const modules = this.nodeWasmModules();
        const dosboxWasm = await modules.dosbox();
        const transportLayer = await dosNodeDirect(dosboxWasm, "session-" + Date.now(),
            mounts, options?.net);
        return this.backend(init, transportLayer, options);
    }

    /**
     * Create a DOSBox instance using NODEFS, running in a Node.js worker thread.
     * @param init - initialization data (bundle, files, or config)
     * @param options - backend options
     * @param mounts - NODEFS mount configuration: { [hostPath]: "subpath under /home/web_user" }
     */
    async dosboxNodeWorker(init: InitFs, options?: BackendOptions,
                           mounts?: NodeMounts): Promise<CommandInterface> {
        const modules = this.nodeWasmModules();
        const dosboxWasm = await modules.dosbox();
        const transportLayer = await dosWorker(
            this.pathPrefix + NODEFS_WDOSBOX_JS + this.pathSuffix,
            dosboxWasm, "session-" + Date.now(), options?.canvas, options?.audioWorklet, options?.net,
            mounts);
        return this.backend(init, transportLayer, options);
    }

    /**
     * Create a DOSBox-X instance using NODEFS, running directly in the current process.
     * @param init - initialization data (bundle, files, or config)
     * @param options - backend options
     * @param mounts - NODEFS mount configuration: { [hostPath]: "subpath under /home/web_user" }
     */
    async dosboxXNodeDirect(init: InitFs, options?: BackendOptions,
                            mounts?: NodeMounts): Promise<CommandInterface> {
        const modules = this.nodeWasmModules();
        const dosboxxWasm = await modules.dosboxx();
        const transportLayer = await dosNodeDirect(dosboxxWasm, "session-" + Date.now(),
            mounts, options?.net);
        return this.backend(init, transportLayer, options);
    }

    /**
     * Create a DOSBox-X instance using NODEFS, running in a Node.js worker thread.
     * @param init - initialization data (bundle, files, or config)
     * @param options - backend options
     * @param mounts - NODEFS mount configuration: { [hostPath]: "subpath under /home/web_user" }
     */
    async dosboxXNodeWorker(init: InitFs, options?: BackendOptions,
                            mounts?: NodeMounts): Promise<CommandInterface> {
        const modules = this.nodeWasmModules();
        const dosboxxWasm = await modules.dosboxx();
        const transportLayer = await dosWorker(
            this.pathPrefix + NODEFS_WDOSBOXX_JS + this.pathSuffix,
            dosboxxWasm, "session-" + Date.now(), options?.canvas, options?.audioWorklet, options?.net,
            mounts);
        return this.backend(init, transportLayer, options);
    }
}


import path from "path";
const project = __filename.endsWith(".ts")? path.resolve(__dirname, ".."):path.resolve(__dirname, "..", "..");

export const BUILTIN = {
    project,
    production: path.join(project, "dist/"),
    development: path.join(project, "build/wasm/"),
};
