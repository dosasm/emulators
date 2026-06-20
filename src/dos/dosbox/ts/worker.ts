import { WasmModule } from "../../../impl/modules";
import { TransportLayer, MessageHandler, ClientMessage, Net } from "../../../protocol/protocol";
import { MessagesQueue } from "../../../protocol/messages-queue";
import { createAudioPort } from "./audio-worklet";

import { platform } from "../../../impl/platform";

export async function dosWorker(workerUrl: string,
                                wasmModule: WasmModule,
                                sessionId: string,
                                canvas?: OffscreenCanvas,
                                audioWorklet?: boolean,
                                net?: Net): Promise<TransportLayer> {
    const messagesQueue = new MessagesQueue();
    let handler: MessageHandler = messagesQueue.handler.bind(messagesQueue);

    const onerror = (e:ErrorEvent) => {
        handler("ws-err", { type: e.type, filename: e.filename, message: e.message });
    };
    const onmessage = (e:MessageEvent) => {
        const data = e.data;
        if (data?.name !== undefined) {
            handler(data.name, data.props);
        }
    };

    const worker = await platform.current.createWorker(workerUrl, onerror, onmessage);

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
        net: net ?? null,
    };

    const transfer: Transferable[] = canvas ? [canvas] : [];
    let audioPort;

    if (audioWorklet) {
        audioPort = await createAudioPort();
        if (audioPort) {
            transfer.push(audioPort);
        }
    }

    try {
        transportLayer.sendMessageToServer("wc-install", {
            module: (wasmModule as any).wasmModule,
            sessionId,
            canvas,
            audioPort,
        }, transfer);
    } catch (e) {
        transportLayer.sendMessageToServer("wc-install", {
            sessionId,
            canvas,
            audioPort,
        }, transfer);
    }

    return transportLayer;
}
