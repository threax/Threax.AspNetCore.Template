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
        return [controller.BindingCollection, ContentFrameControllerConfig, deepLink.IDeepLinkManager];
    }

    private frame: HTMLIFrameElement;

    constructor(bindings: controller.BindingCollection, private config: ContentFrameControllerConfig, private deepLinkManager: deepLink.DeepLinkManager) {
        this.config.cacheUrlBasePath = this.removeTrailingSlash(this.config.cacheUrlBasePath);
        this.config.noCacheUrlBasePath = this.removeTrailingSlash(this.config.noCacheUrlBasePath);

        this.frame = bindings.getHandle("frame") as HTMLIFrameElement;

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