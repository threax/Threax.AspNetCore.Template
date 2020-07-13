import * as controller from 'hr.controller';
import * as startup from 'clientlibs.startup';
import * as deepLink from 'hr.deeplink';
import * as client from 'clientlibs.ServiceClient';
import * as loginPopup from 'hr.relogin.LoginPopup';
import * as contentFrame from 'clientlibs.ContentFrameController';

class AppMenu {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, client.EntryPointInjector];
    }

    private userInfoView: controller.IView<client.AppMenu>;
    private menuItemsView: controller.IView<client.AppMenuItem>;
    private loggedInAreaToggle: controller.OnOffToggle;

    constructor(bindings: controller.BindingCollection, private entryPointInjector: client.EntryPointInjector) {
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
        try {
            const message: loginPopup.ILoginMessage = JSON.parse(e.data);
            if (message.type === loginPopup.MessageType && message.success) {
                this.reloadMenu();
            }
        }
        catch (err) { }
    }
}

const builder = startup.createBuilder();
contentFrame.addServices(builder.Services);
builder.Services.tryAddTransient(AppMenu, AppMenu);
deepLink.addServices(builder.Services);
builder.create("contentFrame", contentFrame.ContentFrameController);
builder.create("appMenu", AppMenu);
