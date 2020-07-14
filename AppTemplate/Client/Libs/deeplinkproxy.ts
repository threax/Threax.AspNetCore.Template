///<amd-module name="hr.deeplinkproxy"/>

import { Uri } from 'hr.uri';
import * as di from 'hr.di';
import * as deeplink from 'hr.deeplink';
import { ExternalPromise } from 'hr.externalpromise';
import * as safepost from 'hr.safepostmessage';
import * as cfc from 'clientlibs.ContentFrameController';

type FlightRequestMap<T> = { [key: string]: InFlightRequest<T> };
const MaxFlightId = 2147483647;
const Timeout = 20000;
const CurrentProxyDeepLinkVersion = "dlv1";

class InFlightRequest<T> {
    private completed = false;

    constructor(private ep: ExternalPromise<T>, private type: string, private flightId: string, private flightMap: FlightRequestMap<T>) {
        window.setTimeout(() => this.handleTimeout(), Timeout); //Set a timeout just in case something goes wrong. This is very unlikely to be needed.
    }

    public resolve(result: T) {
        this.complete();
        this.ep.resolve(result);
    }

    public reject(err: any) {
        this.complete();
        this.ep.reject(err);
    }

    private complete() {
        this.completed = true;
        delete this.flightMap[this.flightId]; //Clean out of the owner flight map, this will free up the id
    }

    private handleTimeout(): void {
        if (!this.completed) {
            this.complete();
            this.ep.reject(new Error(`Did not hear back from target window within ${Timeout}ms. Aborting ${this.type} request.`));
        }
    }
}

enum MessageDirection {
    Request,
    Response
}

interface ProxyDeepLinkMessage {
    proxyDeepLinkVersion: string;
    flightId: string;
    messageType: string;
    direction: MessageDirection;
}

function isDeepLinkProxyMessage(t: any): t is ProxyDeepLinkMessage {
    return t && t.proxyDeepLinkVersion === CurrentProxyDeepLinkVersion && t.flightId && t.messageType;
}

interface ProxyDeepLinkErrorMessage extends ProxyDeepLinkMessage {
    error: Error;
}

function isErrorStateMessage(t: any): t is ProxyDeepLinkErrorMessage {
    return t && t.error;
}

const PushStateRequestType = "PushState";

interface PushStateMessage extends ProxyDeepLinkMessage {
    handler: string;
    inPagePath: string | null;
    query: {} | null;
}

function isPushStateMessage(t: any): t is PushStateMessage {
    return t && t.type === PushStateRequestType && t.handler;
}

const ReplaceStateRequestType = "ReplaceState";

interface ReplaceStateMessage extends ProxyDeepLinkMessage {
    handler: string;
    inPagePath: string | null;
    query: {} | null;
}

function isReplaceStateMessage(t: any): t is PushStateMessage {
    return t && t.type === ReplaceStateRequestType && t.handler;
}

const GetCurrentStateRequestType = "GetCurrentState";

interface GetCurrentStateMessageRequest extends ProxyDeepLinkMessage {
    proto?: {} | null;
}

function isGetCurrentStateMessageRequest(t: any): t is GetCurrentStateMessageRequest {
    return t && t.type === GetCurrentStateRequestType;
}

interface GetCurrentStateMessageResponse extends ProxyDeepLinkMessage {
    args: deeplink.DeepLinkArgs;
}

function isGetCurrentStateMessageResponse(t: any): t is GetCurrentStateMessageResponse {
    return t && t.type === GetCurrentStateRequestType && t.args;
}

export class ProxyDeepLinkManager implements deeplink.IDeepLinkManager {
    private pageBaseUrl: string;
    private handlers: { [key: string]: deeplink.IDeepLinkHandler } = {};
    private inflightPushState: FlightRequestMap<void> = {};
    private inflightReplaceState: FlightRequestMap<void> = {};
    private inflightCurrentState: FlightRequestMap<deeplink.DeepLinkArgs> = {};
    private currentFlightId: number = 0;

    public static get InjectorArgs(): di.DiFunction<any>[] {
        return [safepost.MessagePoster, safepost.PostMessageValidator];
    }


    constructor(private poster: safepost.MessagePoster, private validator: safepost.PostMessageValidator) {

        window.addEventListener("message", e => {
            this.handleMessage(e);
        });
    }

    public registerHandler<T>(name: string, handler: deeplink.IDeepLinkHandler) {
        if (this.handlers[name] !== undefined) {
            throw new Error("Attempted to register an IDeepLinkHandler named '" + name + "' multiple times, only one is allowed.");
        }
        this.handlers[name] = handler;
    }

    public pushStateAsync<T extends {}>(handler: string, inPagePath: string | null, query: {} | null): Promise<void> {
        const request = this.createRequest(ReplaceStateRequestType) as PushStateMessage;
        request.handler = handler;
        request.inPagePath = inPagePath;
        request.query = query;

        const ep = new ExternalPromise<void>();
        this.poster.postWindowMessage(top, request);
        this.inflightPushState[request.flightId] = new InFlightRequest(ep, PushStateRequestType, request.flightId, this.inflightPushState);
        return ep.Promise;
    }

    public replaceStateAsync<T extends {}>(handler: string, inPagePath: string | null, query: {} | null): Promise<void> {
        const request = this.createRequest(ReplaceStateRequestType) as ReplaceStateMessage;
        request.handler = handler;
        request.inPagePath = inPagePath;
        request.query = query;

        const ep = new ExternalPromise<void>();
        this.poster.postWindowMessage(top, request);
        this.inflightReplaceState[request.flightId] = new InFlightRequest(ep, ReplaceStateRequestType, request.flightId, this.inflightReplaceState);
        return ep.Promise;
    }

    public getCurrentStateAsync<T>(proto?: {} | null): Promise<deeplink.DeepLinkArgs | null> {
        const request = this.createRequest(ReplaceStateRequestType) as GetCurrentStateMessageRequest;
        request.proto = proto;

        const ep = new ExternalPromise<deeplink.DeepLinkArgs | null>();
        this.poster.postWindowMessage(top, request);
        this.inflightCurrentState[request.flightId] = new InFlightRequest<deeplink.DeepLinkArgs>(ep, ReplaceStateRequestType, request.flightId, this.inflightCurrentState);
        return ep.Promise;
    }

    private createRequest(type: string): ProxyDeepLinkMessage {
        return {
            proxyDeepLinkVersion: CurrentProxyDeepLinkVersion,
            flightId: this.getNextFlightId(),
            messageType: type,
            direction: MessageDirection.Request,
        };
    }

    private handleMessage(e: MessageEvent): void {
        if (this.validator.isValid(e)) {
            const message = e.data;
            if (isDeepLinkProxyMessage(message) && message.direction === MessageDirection.Response) {
                const flightMap = this.getFlightMap(message.messageType);
                if (flightMap) {
                    const flight = flightMap[message.flightId];
                    if (flight) {
                        if (isErrorStateMessage(message)) {
                            flight.reject(message.error);
                        }
                        else {
                            let result = undefined;
                            if (isGetCurrentStateMessageResponse(message)) {
                                result = message.args;
                            }
                            flight.resolve(result);
                        }
                    }
                }
            }
        }
    }

    private getFlightMap(type: string): FlightRequestMap<unknown> {
        switch (type) {
            case PushStateRequestType:
                return this.inflightPushState;
                break;
            case ReplaceStateRequestType:
                return this.inflightReplaceState;
                break;
            case GetCurrentStateRequestType:
                return this.inflightCurrentState;
                break;
            default:
                return null;
                break;
        }
    }

    private getNextFlightId() {
        let loops = 0; //If we go past the max value a few times this is an infinite loop, abort in that case
        let id: string = null;
        do {
            id = `f${this.currentFlightId++}`;
            if (this.currentFlightId > MaxFlightId) {
                this.currentFlightId = 0;
                if (++loops > 3) {
                    throw new Error("Cannot create a flight id for deep link proxy. Ran out of valid numbers all are currently in flight. This is a serious error with the deep link system. Flights should not remain active except for a very short period of time.");
                }
            }
        }
        while (id in this.inflightCurrentState || id in this.inflightPushState || id in this.inflightReplaceState);

        return id;
    }
}

export class ProxyDeepLinkManagerListener {
    public static get InjectorArgs(): di.DiFunction<any>[] {
        return [safepost.MessagePoster, safepost.PostMessageValidator, deeplink.IDeepLinkManager, cfc.ContentFrameController];
    }


    constructor(private poster: safepost.MessagePoster, private validator: safepost.PostMessageValidator, private deepLinkManager: deeplink.IDeepLinkManager, private contentFrame: cfc.ContentFrameController) {
        window.addEventListener("message", e => {
            this.handleMessage(e);
        });
    }

    private async handlePushState<T extends {}>(message: PushStateMessage): Promise<void> {
        const response: ProxyDeepLinkMessage = {
            proxyDeepLinkVersion: CurrentProxyDeepLinkVersion,
            flightId: message.flightId,
            messageType: PushStateRequestType,
            direction: MessageDirection.Response,
        };

        try {
            await this.deepLinkManager.pushStateAsync(message.handler, message.inPagePath, message.query);
            this.poster.postWindowMessage(this.contentFrame.getContentWindow(), response);
        }
        catch (err) {
            (response as ProxyDeepLinkErrorMessage).error = err;
            this.poster.postWindowMessage(this.contentFrame.getContentWindow(), response);
        }
    }

    private async handleReplaceState<T extends {}>(message: PushStateMessage): Promise<void> {
        const response: ProxyDeepLinkMessage = {
            proxyDeepLinkVersion: CurrentProxyDeepLinkVersion,
            flightId: message.flightId,
            messageType: ReplaceStateRequestType,
            direction: MessageDirection.Response,
        };

        try {
            await this.deepLinkManager.replaceStateAsync(message.handler, message.inPagePath, message.query);
            this.poster.postWindowMessage(this.contentFrame.getContentWindow(), response);
        }
        catch (err) {
            (response as ProxyDeepLinkErrorMessage).error = err;
            this.poster.postWindowMessage(this.contentFrame.getContentWindow(), response);
        }
    }

    private async handleGetCurrentState<T>(message: GetCurrentStateMessageRequest): Promise<void> {
        const response: ProxyDeepLinkMessage = {
            proxyDeepLinkVersion: CurrentProxyDeepLinkVersion,
            flightId: message.flightId,
            messageType: GetCurrentStateRequestType,
            direction: MessageDirection.Response
        }

        try {
            (response as GetCurrentStateMessageResponse).args = await this.deepLinkManager.getCurrentStateAsync(message.proto);
            this.poster.postWindowMessage(this.contentFrame.getContentWindow(), response);
        }
        catch (err) {
            (response as ProxyDeepLinkErrorMessage).error = err;
            this.poster.postWindowMessage(this.contentFrame.getContentWindow(), response);
        }
    }

    private handleMessage(e: MessageEvent): void {
        if (this.validator.isValid(e)) {
            const message = e.data;
            if (isDeepLinkProxyMessage(message) && message.direction === MessageDirection.Request) {
                //Check message type, these will be fired off async, but that is ok since they will post responses back to the other window on their own.
                if (isPushStateMessage(message)) {
                    this.handlePushState(message);
                }
                else if (isReplaceStateMessage(message)) {
                    this.handleReplaceState(message);
                }
                else if (isGetCurrentStateMessageRequest(message)) {
                    this.handleGetCurrentState(message);
                }
            }
        }
    }
}