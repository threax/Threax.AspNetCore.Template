///<amd-module name="hr.deeplinkproxy"/>

import { Uri } from 'hr.uri';
import * as di from 'hr.di';
import * as deeplink from 'hr.deeplink';
import { ExternalPromise } from 'hr.externalpromise';
import * as safepost from 'hr.safepostmessage';
import * as cfc from 'clientlibs.ContentFrameController';

type FlightRequestMap<T> = { [key: string]: InFlightRequest<T> };
const MaxFlightId = 2147483647;
const Timeout = 2000;
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
    return t && t.messageType === PushStateRequestType && t.handler;
}

const ReplaceStateRequestType = "ReplaceState";

interface ReplaceStateMessage extends ProxyDeepLinkMessage {
    handler: string;
    inPagePath: string | null;
    query: {} | null;
}

function isReplaceStateMessage(t: any): t is PushStateMessage {
    return t && t.messageType === ReplaceStateRequestType && t.handler;
}

const GetCurrentStateRequestType = "GetCurrentState";

interface GetCurrentStateMessageRequest extends ProxyDeepLinkMessage {
    proto?: {} | null;
}

function isGetCurrentStateMessageRequest(t: any): t is GetCurrentStateMessageRequest {
    return t && t.messageType === GetCurrentStateRequestType;
}

interface GetCurrentStateMessageResponse extends ProxyDeepLinkMessage {
    args: deeplink.IDeepLinkArgs;
}

function isGetCurrentStateMessageResponse(t: any): t is GetCurrentStateMessageResponse {
    return t && t.messageType === GetCurrentStateRequestType && t.args;
}

const OnPopStateRequestType = "OnPopState";

interface OnPopStateRequest extends ProxyDeepLinkMessage {
    args: deeplink.IDeepLinkArgs;
}

function isOnPopStateRequest(t: any): t is OnPopStateRequest {
    return t && t.messageType === OnPopStateRequestType && t.args;
}

const HandlerAddedRequestType = "HandlerAdded";

interface HandlerAddedRequest extends ProxyDeepLinkMessage {
    name: string;
}

function isHandlerAddedRequest(t: any): t is HandlerAddedRequest {
    return t && t.messageType === HandlerAddedRequestType && t.name;
}

function createRequest(type: string, flightId: string): ProxyDeepLinkMessage {
    return {
        proxyDeepLinkVersion: CurrentProxyDeepLinkVersion,
        flightId: flightId,
        messageType: type,
        direction: MessageDirection.Request,
    };
}

function createResponse(type: string, flightId: string): ProxyDeepLinkMessage {
    return {
        proxyDeepLinkVersion: CurrentProxyDeepLinkVersion,
        flightId: flightId,
        messageType: type,
        direction: MessageDirection.Response,
    };
}

function makeArgsTransferrable(args: deeplink.IDeepLinkArgs): deeplink.IDeepLinkArgs {
    return {
        handler: args.handler,
        inPagePath: args.inPagePath,
        query: args.query
    };
}

export class ProxyDeepLinkManager implements deeplink.IDeepLinkManager {
    private pageBaseUrl: string;
    private handlers: { [key: string]: deeplink.IDeepLinkHandler } = {};
    private inflightPushState: FlightRequestMap<void> = {};
    private inflightReplaceState: FlightRequestMap<void> = {};
    private inflightCurrentState: FlightRequestMap<deeplink.IDeepLinkArgs> = {};
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
        let request = createRequest(HandlerAddedRequestType, this.getNextFlightId()) as HandlerAddedRequest;
        request.name = name;
        this.poster.postWindowMessage(top, request);
    }

    public pushStateAsync<T extends {}>(handler: string, inPagePath: string | null, query: {} | null): Promise<void> {
        const request = createRequest(PushStateRequestType, this.getNextFlightId()) as PushStateMessage;
        request.handler = handler;
        request.inPagePath = inPagePath;
        request.query = query;

        const ep = new ExternalPromise<void>();
        this.poster.postWindowMessage(top, request);
        this.inflightPushState[request.flightId] = new InFlightRequest(ep, PushStateRequestType, request.flightId, this.inflightPushState);
        return ep.Promise;
    }

    public replaceStateAsync<T extends {}>(handler: string, inPagePath: string | null, query: {} | null): Promise<void> {
        const request = createRequest(ReplaceStateRequestType, this.getNextFlightId()) as ReplaceStateMessage;
        request.handler = handler;
        request.inPagePath = inPagePath;
        request.query = query;

        const ep = new ExternalPromise<void>();
        this.poster.postWindowMessage(top, request);
        this.inflightReplaceState[request.flightId] = new InFlightRequest(ep, ReplaceStateRequestType, request.flightId, this.inflightReplaceState);
        return ep.Promise;
    }

    public getCurrentStateAsync<T>(proto?: {} | null): Promise<deeplink.IDeepLinkArgs | null> {
        const request = createRequest(GetCurrentStateRequestType, this.getNextFlightId()) as GetCurrentStateMessageRequest;
        request.proto = proto;

        const ep = new ExternalPromise<deeplink.IDeepLinkArgs | null>();
        this.poster.postWindowMessage(top, request);
        this.inflightCurrentState[request.flightId] = new InFlightRequest<deeplink.IDeepLinkArgs>(ep, GetCurrentStateRequestType, request.flightId, this.inflightCurrentState);
        return ep.Promise;
    }

    private handleMessage(e: MessageEvent): void {
        if (this.validator.isValid(e)) {
            const message = e.data;
            if (isDeepLinkProxyMessage(message)) {
                if (message.direction === MessageDirection.Response) {
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
                else if (message.direction === MessageDirection.Request) {
                    if (isOnPopStateRequest(message)) {
                        this.fireOnPopState(message.args);
                    }
                }
            }
        }
    }

    private fireOnPopState(args: deeplink.IDeepLinkArgs) {
        const myArgs = args;
        const handlerName = myArgs.handler;
        if (handlerName) {
            const handler = this.handlers[handlerName];
            if (handler) {
                handler.onPopState(myArgs);
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

export class ProxyDeepLinkManagerListener implements deeplink.IDeepLinkHandler {
    public static get InjectorArgs(): di.DiFunction<any>[] {
        return [safepost.MessagePoster, safepost.PostMessageValidator, deeplink.IDeepLinkManager, cfc.ContentFrameController];
    }

    private registeredHandlers = {};

    constructor(private poster: safepost.MessagePoster, private validator: safepost.PostMessageValidator, private deepLinkManager: deeplink.IDeepLinkManager, private contentFrame: cfc.ContentFrameController) {
        window.addEventListener("message", e => {
            this.handleMessage(e);
        });
    }

    public onPopState(args: deeplink.IDeepLinkArgs) {
        const request = createRequest(OnPopStateRequestType, "none") as OnPopStateRequest; //Don't care about responses for this
        request.args = makeArgsTransferrable(args);
        this.poster.postWindowMessage(this.contentFrame.getContentWindow(), request);
    }

    private async handlePushState<T extends {}>(message: PushStateMessage): Promise<void> {
        const response = createResponse(PushStateRequestType, message.flightId);

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
        const response = createResponse(ReplaceStateRequestType, message.flightId);

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
        const response = createResponse(GetCurrentStateRequestType, message.flightId);

        try {
            (response as GetCurrentStateMessageResponse).args = makeArgsTransferrable(await this.deepLinkManager.getCurrentStateAsync(message.proto));
            this.poster.postWindowMessage(this.contentFrame.getContentWindow(), response);
        }
        catch (err) {
            (response as ProxyDeepLinkErrorMessage).error = err;
            this.poster.postWindowMessage(this.contentFrame.getContentWindow(), response);
        }
    }

    private async handleHandlerAdded<T>(message: HandlerAddedRequest): Promise<void> {
        if (!this.registeredHandlers[message.name]) {
            //Don't try to register this again. This isn't really an error since the handler may have been registered before.
            //Technically these leak into the main page since the sub pages never rename them, but apps don't make that many handlers
            this.registeredHandlers[message.name] = true;
            this.deepLinkManager.registerHandler(message.name, this);
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
                else if (isHandlerAddedRequest(message)) {
                    this.handleHandlerAdded(message);
                }
            }
        }
    }
}

export function addListener(services: di.ServiceCollection) {
    services.tryAddShared(ProxyDeepLinkManagerListener, ProxyDeepLinkManagerListener);
}

export function addDeepLinkManager(services: di.ServiceCollection) {
    services.tryAddShared(deeplink.IDeepLinkManager, ProxyDeepLinkManager);
}