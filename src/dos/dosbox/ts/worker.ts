import { WasmModule } from "../../../impl/modules";
import { TransportLayer, MessageHandler, ClientMessage } from "../../../protocol/protocol";
import { MessagesQueue } from "../../../protocol/messages-queue";

import {platform} from "../../../impl/platform";

export async function dosWorker(workerUrl: string,
                                wasmModule: WasmModule,
                                sessionId: string): Promise<TransportLayer> {
    const messagesQueue = new MessagesQueue();
    let handler: MessageHandler = messagesQueue.handler.bind(messagesQueue);

    let onerror = (e:ErrorEvent) => {
        handler("ws-err", { type: e.type, filename: e.filename, message: e.message });
    };
    let onmessage = (e:MessageEvent) => {
        const data = e.data;
        if (data?.name !== undefined) {
            handler(data.name, data.props);
        }
    };

    const worker = await platform.current.createWorker(workerUrl,onerror,onmessage);
    

    await wasmModule.instantiate({});

    const transportLayer: TransportLayer = {
        sessionId,
        sendMessageToServer: (name: ClientMessage,
            props: {[key: string]: any},
            transfer?: ArrayBuffer[]) => {
            if (transfer) {
                worker.postMessage({ name, props }, transfer);
            } else {
                worker.postMessage({ name, props });
            }
        },
        initMessageHandler: (newHandler: MessageHandler) => {
            handler = newHandler;
            messagesQueue.sendTo(handler);
        },
        exit: () => {
            worker.terminate();
        },
    };

    try {
        transportLayer.sendMessageToServer("wc-install", {
            module: (wasmModule as any).wasmModule,
            sessionId,
        });
    } catch (e) {
        transportLayer.sendMessageToServer("wc-install", { sessionId });
    }

    return transportLayer;
}
