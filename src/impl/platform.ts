import {HttpRequest,XhrOptions,XhrRequest} from "./http"
export {HttpRequest,XhrOptions,XhrRequest}

export interface Platform {
    name: string
    createWorker(workerUrl: string,onerror:(e:ErrorEvent)=>void,onmessage:(e:MessageEvent)=>void): Promise<Worker> 
    node_require(path:string):any
    httpRequest:HttpRequest
}


class EmptyPlatform implements Platform {
    name = "empty"
    createWorker(workerUrl: string,onerror:(e:ErrorEvent)=>void,onmessage:(e:MessageEvent)=>void): Promise<Worker> {
        throw new Error("Empty platform")
    }
    node_require(path:string):any {
        throw new Error("Empty platform")
    }
    httpRequest = (url:string,options:XhrOptions):Promise<string>=>{throw new Error("Empty platform")}
}

export class PlatformSingleton {
    current: Platform
    constructor() {
        this.current = new EmptyPlatform()
    }
    set(platform: Platform) {
        this.current = platform
    }
}

export const platform = new PlatformSingleton()