import * as controller from 'hr.controller';
import * as startup from 'clientlibs.startup';
import * as deepLink from 'hr.deeplink';
import * as uri from 'hr.uri';

declare function iFrameResize(arg: any, iframe: HTMLIFrameElement);

class ContentFrameController {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection];
    }

    private frame: HTMLIFrameElement;

    constructor(bindings: controller.BindingCollection) {
        this.frame = bindings.getHandle("frame") as HTMLIFrameElement;
        //this.iframeURLChange(this.frame, (href) => {
        //    console.log(`Frame Changing to ${href}`);
        //    const newUri = uri.parseUri(href);
        //    const currentUri = uri.parseUri(window.location.href);
        //    if (newUri.host !== currentUri.host) {
        //        window.location.href = href; //Underling page changing domains, just load it top level instead
        //    }
        //});
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
        this.frame.addEventListener("load", () => {
            let href = null;
            try {
                href = this.frame.contentWindow.location.href;
            }
            catch (err) {
                //Unknown embedded site, go into full size mode
                this.frame.style.height = "1000px";
            }
        });

        window.onmessage = (e) => {
            console.log(`Got message ${e.data}`);
            //if (e.data == 'hello') {
            //    alert('It works!');
            //}
        };
    }

    public load(evt: Event): void {
        console.log("Frame loaded");
    }

    ////Thanks to nicojs for this https://gist.github.com/hdodov/a87c097216718655ead6cf2969b0dcfa
    //private iframeURLChange(iframe, callback) {
    //    //let lastDispatched = null;
    //    let allowDispatch = false;

    //    const dispatchChange = function () {
    //        const newHref = iframe.contentWindow.location.href;

    //        //if (newHref !== lastDispatched) {
    //        if (allowDispatch) {
    //            callback(newHref);
    //            //lastDispatched = newHref;
    //        }
    //        allowDispatch = true;
    //    };

    //    const unloadHandler = function () {
    //        // Timeout needed because the URL changes immediately after
    //        // the `unload` event is dispatched.
    //        setTimeout(dispatchChange, 0);
    //    };

    //    function attachUnload() {
    //        // Remove the unloadHandler in case it was already attached.
    //        // Otherwise, there will be two handlers, which is unnecessary.
    //        iframe.contentWindow.removeEventListener("unload", unloadHandler);
    //        iframe.contentWindow.addEventListener("unload", unloadHandler);
    //    }

    //    iframe.addEventListener("load", function () {
    //        attachUnload();
    //    });

    //    attachUnload();
    //}

}

const builder = startup.createBuilder();
builder.Services.tryAddTransient(ContentFrameController, ContentFrameController);
deepLink.addServices(builder.Services);
builder.create("contentFrame", ContentFrameController);

