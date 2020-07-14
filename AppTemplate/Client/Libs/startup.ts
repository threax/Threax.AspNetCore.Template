import * as hr from 'hr.main';
import * as datetime from 'hr.bootstrap.datetime.main';
import * as bootstrap from 'hr.bootstrap.main';
import * as bootstrap4form from 'hr.form.bootstrap4.main';
import * as controller from 'hr.controller';
import * as WindowFetch from 'hr.windowfetch';
import * as AccessTokens from 'hr.accesstokens';
import * as whitelist from 'hr.whitelist';
import * as fetcher from 'hr.fetcher';
import * as client from 'clientlibs.ServiceClient';
import * as userSearch from 'clientlibs.UserSearchClientEntryPointInjector';
import * as loginPopup from 'hr.relogin.LoginPopup';
import * as deepLink from 'hr.deeplink';
import * as pageConfig from 'hr.pageconfig';
import * as contentFrame from 'clientlibs.ContentFrameController';
import * as safepost from 'hr.safepostmessage';
import * as deeplinkproxy from 'clientlibs.deeplinkproxy';

//Activate htmlrapier
hr.setup();
datetime.setup();
bootstrap.setup();
bootstrap4form.setup();

export interface Config {
    client: {
        ServiceUrl: string;
        PageBasePath: string;
        BearerCookieName?: string;
        AccessTokenPath?: string;
        HashUiBasePath: string;
    };
    page: {
        AlwaysRequestLogin: boolean;
        AllowServerTokenRefresh: boolean;
        UseProxyDeepLinks: boolean;
    };
}

let builder: controller.InjectedControllerBuilder = null;

export function createBuilder() {
    if (builder === null) {
        const config = pageConfig.read<Config>();
        builder = new controller.InjectedControllerBuilder();

        //Setup content frame controller
        builder.Services.addShared(contentFrame.ContentFrameControllerConfig, s => {
            const frameConfig = new contentFrame.ContentFrameControllerConfig();
            frameConfig.cacheUrlBasePath = config.client.PageBasePath + config.client.HashUiBasePath;
            frameConfig.noCacheUrlBasePath = config.client.PageBasePath;
            return frameConfig;
        });

        //Set up the access token fetcher
        builder.Services.tryAddShared(fetcher.Fetcher, s => createFetcher(config));
        builder.Services.tryAddShared(safepost.MessagePoster, s => new safepost.MessagePoster(window.location.href));
        builder.Services.tryAddShared(safepost.PostMessageValidator, s => new safepost.PostMessageValidator(window.location.href));
        builder.Services.tryAddShared(client.EntryPointInjector, s => new client.EntryPointInjector(config.client.ServiceUrl, s.getRequiredService(fetcher.Fetcher)));
        
        userSearch.addServices(builder);

        //Setup Deep Links
        deepLink.setPageUrl(builder.Services, config.client.PageBasePath);
        if (config.page.UseProxyDeepLinks) {
            deeplinkproxy.addDeepLinkManager(builder.Services);
        }
        else {
            deeplinkproxy.addListener(builder.Services);
        }

        //Setup relogin
        loginPopup.addServices(builder.Services);
        builder.create("hr-relogin", loginPopup.LoginPopup);
    }
    return builder;
}

function createFetcher(config: Config): fetcher.Fetcher {
    let fetcher = new WindowFetch.WindowFetch();

    if (config.client.AccessTokenPath) {
        const accessFetcher = new AccessTokens.AccessTokenFetcher(
            config.client.AccessTokenPath,
            new whitelist.Whitelist([config.client.ServiceUrl]),
            fetcher);
        accessFetcher.alwaysRequestLogin = config.page.AlwaysRequestLogin;
        accessFetcher.disableOnNoToken = false;
        accessFetcher.bearerCookieName = config.client.BearerCookieName;
        accessFetcher.allowServerTokenRefresh = config.page.AllowServerTokenRefresh;
        fetcher = accessFetcher;
    }

    return fetcher;
}