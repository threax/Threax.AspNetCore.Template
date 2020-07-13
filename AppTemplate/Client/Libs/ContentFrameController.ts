import * as controller from 'hr.controller';
import * as startup from 'clientlibs.startup';
import * as deepLink from 'hr.deeplink';
import * as client from 'clientlibs.ServiceClient';
import * as loginPopup from 'hr.relogin.LoginPopup';
import * as uri from 'hr.uri';

declare function iFrameResize(arg: any, iframe: HTMLIFrameElement);

export class ContentFrameControllerConfig {
    urlBasePath: string = null;
}

export class ContentFrameController {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, ContentFrameControllerConfig];
    }

    private frame: HTMLIFrameElement;

    constructor(bindings: controller.BindingCollection, private config: ContentFrameControllerConfig) {
        this.frame = bindings.getHandle("frame") as HTMLIFrameElement;

        //Go to location from /#/ path
        //This will work if all cached controllers use the same base path.
        //This can be better, might need a base path the whole ui can live on, probably a few options here
        const url = uri.parseUri(window.location.href);
        if (url.anchor && this.config.urlBasePath) {
            const newUrl = url.protocol + '://' + url.authority + this.config.urlBasePath + url.anchor;
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

    public load(evt: Event): void {
        let path: string = "External";
        let query: string = "";
        const currentUrl = uri.parseUri(window.location.href);
        try {
            const frameUrl = uri.parseUri(this.frame.contentWindow.location.href);
            path = frameUrl.path;
            query = frameUrl.query;
            if (this.config.urlBasePath) {
                const index = frameUrl.path.indexOf(this.config.urlBasePath);
                if (index !== -1) {
                    path = path.substr(index + this.config.urlBasePath.length);
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

    public validateCanReadSize(evt: Event): void {
        try {
            let href = this.frame.contentWindow.location.href;
        }
        catch (err) {
            //Unknown embedded site, go into full size mode
            this.frame.style.height = "1000px";
        }
    }
}

export function addServices(services: controller.ServiceCollection) {
    services.tryAddShared(ContentFrameControllerConfig, s => new ContentFrameControllerConfig());
    services.tryAddTransient(ContentFrameController, ContentFrameController);
}