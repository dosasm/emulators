import {HttpRequest,XhrOptions,XhrRequest} from "./http"

export interface Platform {
    name: string
    createWorker(workerUrl: string,onerror:(e:ErrorEvent)=>void,onmessage:(e:MessageEvent)=>void): Promise<Worker> 
    node_require(path:string):any
    httpRequest:HttpRequest
}

export class NodeJs implements Platform {
    name = "nodejs"
    httpRequest=XhrRequest
    node_require(path: string) {
        return require(path)
    }
    createWorker(workerUrl: string,onerror:(e:ErrorEvent)=>void,onmessage:(e:MessageEvent)=>void): Promise<Worker> {
        const node_workder_threads=eval(`require("node:worker_threads")`)
        const w=new node_workder_threads.Worker(workerUrl)
        w.on('message', (message:any) => {
            onmessage({data:message} as any)
        });
        w.on('error',(error:any)=>{
            onerror({type:"node worker thread",filename:error.stack,message:error.message} as any)
        })
        return w
    }
}

export class Browser implements Platform {
    name = "browser"
    httpRequest=XhrRequest
    node_require(path: string) {
        return require(path)
    }
    async createWorker(workerUrl: string,onerror:(e:ErrorEvent)=>void,onmessage:(e:MessageEvent)=>void): Promise<Worker>{
        const response = await fetch(workerUrl);
        if (response.status !== 200) {
            throw new Error("Unable to download '" + workerUrl + "' (" +
                response.status + "): " + response.statusText);
        }
        const b = await response.blob()
        const localUrl = URL.createObjectURL(b);
        const worker = new Worker(localUrl);
        worker.onerror=onerror;
        worker.onmessage=onmessage
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