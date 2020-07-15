///<amd-module name="clientlibs.AppMenu"/>

import * as controller from 'hr.controller';
import * as startup from 'clientlibs.startup';
import * as client from 'clientlibs.ServiceClient';
import * as loginPopup from 'hr.relogin.LoginPopup';
import * as safepost from 'hr.safepostmessage';
import * as iter from 'hr.iterable';

interface AppMenuItem {
    text: string;
    href: string;
}

class AppMenu {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, client.EntryPointInjector, safepost.PostMessageValidator];
    }

    private userInfoView: controller.IView<client.EntryPoint>;
    private menuItemsView: controller.IView<AppMenuItem>;
    private loggedInAreaToggle: controller.OnOffToggle;
    private refreshEntry = false;

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
        if (this.refreshEntry) {
            await entry.refresh();
        }
        this.refreshEntry = true; //Want to skip this the first time, since the data will be fresh.
        this.userInfoView.setData(entry.data);
        const menu = this.createMenu(entry);
        this.menuItemsView.setData(new iter.Iterable(menu));
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

    private * createMenu(entry: client.EntryPointResult): Generator<AppMenuItem> {
        yield { text: "Home", href: "" };
        yield { text: "Values", href: "Values" };

        if (entry.canListUsers()) {
            yield { text: "Users", href: "Admin/Users" };
        }
    }
}

const builder = startup.createBuilder();
builder.Services.tryAddTransient(AppMenu, AppMenu);
builder.create("appMenu", AppMenu);