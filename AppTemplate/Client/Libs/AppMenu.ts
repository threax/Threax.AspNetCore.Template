///<amd-module name="clientlibs.AppMenu"/>

import * as controller from 'hr.controller';
import * as startup from 'clientlibs.startup';
import * as deepLink from 'hr.deeplink';
import * as client from 'clientlibs.ServiceClient';
import * as loginPopup from 'hr.relogin.LoginPopup';
import * as safepost from 'hr.safepostmessage';

class AppMenu {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, client.EntryPointInjector, safepost.PostMessageValidator];
    }

    private userInfoView: controller.IView<client.EntryPoint>;
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
        this.userInfoView.setData(entry.data);
        this.menuItemsView.setData(entry.data.menuItems);
        this.loggedInAreaToggle.mode = entry.data.isAuthenticated;
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
builder.Services.tryAddTransient(AppMenu, AppMenu);
builder.create("appMenu", AppMenu);