import {HttpRequest,XhrOptions,XhrRequest} from "./http"

export interface Platform {
    name: string
    createWorker(workerUrl: string): Promise<Worker> 
    node_require(path:string):any
    httpRequest:HttpRequest
}

export class NodeJs implements Platform {
    name = "nodejs"
    httpRequest=XhrRequest
    node_require(path: string) {
        return require(path)
    }
    createWorker(workerUrl: string): Promise<Worker> {
        throw new Error("not implemented")
        // const worker_threads = require("worker_threads");
        // return new worker_threads.Worker(workerUrl);
    }
}

export class Browser implements Platform {
    name = "browser"
    httpRequest=XhrRequest
    node_require(path: string) {
        return require(path)
    }
    async createWorker(workerUrl: string): Promise<Worker>{
        const response = await fetch(workerUrl);
        if (response.status !== 200) {
            throw new Error("Unable to download '" + workerUrl + "' (" +
                response.status + "): " + response.statusText);
        }
        const b = await response.blob()
        const localUrl = URL.createObjectURL(b);
        const worker = new Worker(localUrl);
        return worker
    }
}

export class PlatformSingleton {
    current: Platform
    constructor() {
        if (typeof process !== 'undefined' && process.versions && process.versions.node) {
            this.current = new NodeJs()
        }else {
            this.current = new Browser()
        }
    }
    set(platform: Platform) {
        this.current = platform
    }
}

export const platform = new PlatformSingleton()