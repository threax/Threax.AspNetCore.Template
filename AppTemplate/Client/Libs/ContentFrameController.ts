import * as controller from 'hr.controller';
import * as startup from 'clientlibs.startup';
import * as deepLink from 'hr.deeplink';
import * as client from 'clientlibs.ServiceClient';
import * as loginPopup from 'hr.relogin.LoginPopup';
import * as uri from 'hr.uri';

declare function iFrameResize(arg: any, iframe: HTMLIFrameElement);

export class ContentFrameControllerConfig {
    cacheUrlBasePath: string = null;
    noCacheUrlBasePath: string = null;
}

export class ContentFrameController {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, ContentFrameControllerConfig];
    }

    private frame: HTMLIFrameElement;

    constructor(bindings: controller.BindingCollection, private config: ContentFrameControllerConfig) {
        this.config.cacheUrlBasePath = this.removeTrailingSlash(this.config.cacheUrlBasePath);
        this.config.noCacheUrlBasePath = this.removeTrailingSlash(this.config.noCacheUrlBasePath);

        this.frame = bindings.getHandle("frame") as HTMLIFrameElement;

        //Go to location from /#/ path
        //This will work if all cached controllers use the same base path.
        //This can be better, might need a base path the whole ui can live on, probably a few options here
        const url = uri.parseUri(window.location.href);
        if (url.anchor) {
            if (url.anchor[0] === '!') {
                if (this.config.noCacheUrlBasePath !== null && this.config.noCacheUrlBasePath !== undefined) { //Allow empty strings
                    const newUrl = url.protocol + '://' + url.authority + this.config.noCacheUrlBasePath + url.anchor.substr(1); //Remove !
                    this.frame.src = newUrl;
                }
            }
            else {
                if (this.config.cacheUrlBasePath) {
                    const newUrl = url.protocol + '://' + url.authority + this.config.cacheUrlBasePath + url.anchor;
                    this.frame.src = newUrl;
                }
            }
        }
        else {
            //This means that index is being called. Assume this means cached since if it wasn't the above if would be true for the lone '!' in the string.
            const newUrl = url.protocol + '://' + url.authority + this.config.cacheUrlBasePath;
            this.frame.src = newUrl;
        }

        const opt = {
            log: false,                  // Enable console logging
            resizedCallback: function (messageData) { // Callback fn when resize is received

            },
            messageCallback: function (messageData) { // Callback fn when message is received

                alert(messageData.message);
            },
            closedCallback: function (id) { // Callback fn when iFrame is closed

            }
        };
        iFrameResize(opt, this.frame);

        //Want this to fire after the resize.
        this.frame.addEventListener("load", (e) => this.validateCanReadSize(e));
    }

    public getContentWindow(): Window {
        return this.frame.contentWindow;
    }

    public load(evt: Event): void {
        let path: string = "External";
        let query: string = "";
        const currentUrl = uri.parseUri(window.location.href);
        try {
            const frameUrl = uri.parseUri(this.frame.contentWindow.location.href);
            path = frameUrl.path;
            query = frameUrl.query;
            if (this.config.cacheUrlBasePath) {
                const index = frameUrl.path.indexOf(this.config.cacheUrlBasePath);
                if (index !== -1) {
                    path = path.substr(index + this.config.cacheUrlBasePath.length);
                }
                else {
                    path = "!" + path;
                }
            }
        }
        catch (err) { } //Ignored

        if (query && query.charAt(0) !== '?') {
            query = '?' + query;
        }
        currentUrl.anchor = path + query;
        const newUrl = `${currentUrl.build()}#${currentUrl.anchor}`;
        window.location.href = newUrl;
    }

    private validateCanReadSize(evt: Event): void {
        try {
            let href = this.frame.contentWindow.location.href;
        }
        catch (err) {
            //Unknown embedded site, go into full size mode
            this.frame.style.height = "1000px";
        }
    }

    private removeTrailingSlash(test: string): string {
        if (test) {
            const last = test[test.length - 1];
            if (last === '/' || last === '\\') {
                test = test.substr(0, test.length - 1);
            }
        }
        return test;
    }
}

export function addServices(services: controller.ServiceCollection) {
    services.tryAddShared(ContentFrameControllerConfig, s => new ContentFrameControllerConfig());
    services.tryAddShared(ContentFrameController, ContentFrameController); //Can only create one of these
}