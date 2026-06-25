export * from "./emulators";

import { Platform, platform } from "./impl/platform";
import { XhrRequest } from "./impl/http";

export class Browser implements Platform {
    resolveJSpath(a: { prefix: string; js: string; suffix: string }): string {
        throw new Error("Method not implemented.");
    }
    name = "browser";
    httpRequest=XhrRequest;
    node_require(path: string) {
        return require(path);
    }
    async createWorker(workerUrl: string, onerror:(e:ErrorEvent)=>void,
        onmessage:(e:MessageEvent)=>void): Promise<Worker> {
        const response = await fetch(workerUrl);
        if (response.status !== 200) {
            throw new Error("Unable to download '" + workerUrl + "' (" +
                response.status + "): " + response.statusText);
        }
        const b = await response.blob();
        const localUrl = URL.createObjectURL(b);
        const worker = new Worker(localUrl);
        worker.onerror=onerror;
        worker.onmessage=onmessage;
        return worker;
    }
}

platform.current=new Browser();
