import { XhrOptions } from "./impl/http";
import { platform } from "./impl/platform";

export const httpRequest=platform.current.httpRequest

export function XhrRequest(url: string, options: XhrOptions): Promise<string | ArrayBuffer> {
    return platform.current.httpRequest(url,options)
}