import * as controller from 'hr.controller';
import * as startup from 'clientlibs.startup';
import * as deepLink from 'hr.deeplink';
import * as client from 'clientlibs.ServiceClient';
import * as loginPopup from 'hr.relogin.LoginPopup';
import * as contentFrame from 'clientlibs.ContentFrameController';
import * as safepost from 'hr.safepostmessage';
import * as deeplinkproxy from 'clientlibs.deeplinkproxy';

class AppMenu {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, client.EntryPointInjector, safepost.PostMessageValidator];
    }

    private userInfoView: controller.IView<client.AppMenu>;
    private menuItemsView: controller.IView<client.AppMenuItem>;
    private loggedInAreaToggle: controller.OnOffToggle;

    constructor(bindings: controller.BindingCollection, private entryPointInjector: client.EntryPointInjector, private messageValidator: safepost.PostMessageValidator) {
        this.userInfoView = bindings.getView("userInfo");
        this.menuItemsView = bindings.getView("menuItems");
        this.loggedInAreaToggle = bindings.getToggle("loggedInArea");

        //Listen for relogin events
        window.addEventListener("message", e => { this.handleMessage(e); });

        this.reloadMenu();
    }

    private async reloadMenu(): Promise<void> {
        const entry = await this.entryPointInjector.load();
        const menu = await entry.getAppMenu();
        this.userInfoView.setData(menu.data);
        this.menuItemsView.setData(menu.data.menuItems);
        this.loggedInAreaToggle.mode = menu.data.isAuthenticated;
    }

    private handleMessage(e: MessageEvent): void {
        if (this.messageValidator.isValid(e)) {
            const message: loginPopup.ILoginMessage = e.data;
            if (message.type === loginPopup.MessageType && message.success) {
                this.reloadMenu();
            }
        }
    }
}

const builder = startup.createBuilder();
contentFrame.addServices(builder.Services);
builder.Services.tryAddTransient(AppMenu, AppMenu);
deepLink.addServices(builder.Services);
builder.create("contentFrame", contentFrame.ContentFrameController);
builder.create("appMenu", AppMenu);
builder.createUnbound(deeplinkproxy.ProxyDeepLinkManagerListener);