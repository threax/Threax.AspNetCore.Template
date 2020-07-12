﻿import * as hr from 'hr.main';
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
import * as xsrf from 'hr.xsrftoken';
import * as pageConfig from 'hr.pageconfig';

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
    };
    tokens: {
        AccessTokenPath?: string;
        XsrfCookie?: string;
        XsrfPaths?: string[];
    };
    page: {
        AlwaysRequestLogin: boolean;
    };
}

let builder: controller.InjectedControllerBuilder = null;

export function createBuilder() {
    if (builder === null) {
        builder = new controller.InjectedControllerBuilder();

        //Set up the access token fetcher
        const config = pageConfig.read<Config>();
        builder.Services.tryAddShared(fetcher.Fetcher, s => createFetcher(config));
        builder.Services.tryAddShared(client.EntryPointInjector, s => new client.EntryPointInjector(config.client.ServiceUrl, s.getRequiredService(fetcher.Fetcher)));
        
        userSearch.addServices(builder);

        //Setup Deep Links
        deepLink.setPageUrl(builder.Services, config.client.PageBasePath);

        //Setup relogin
        loginPopup.addServices(builder.Services);
        builder.create("hr-relogin", loginPopup.LoginPopup);
    }
    return builder;
}

function createFetcher(config: Config): fetcher.Fetcher {
    let fetcher = new WindowFetch.WindowFetch();

    if (config.tokens !== undefined) {
        fetcher = new xsrf.XsrfTokenFetcher(
            new xsrf.CookieTokenAccessor(config.tokens.XsrfCookie),
            new whitelist.Whitelist(config.tokens.XsrfPaths),
            fetcher);
    }

    if (config.tokens.AccessTokenPath !== undefined) {
        const accessFetcher = new AccessTokens.AccessTokenFetcher(
            config.tokens.AccessTokenPath,
            new whitelist.Whitelist([config.client.ServiceUrl]),
            fetcher);
        accessFetcher.alwaysRequestLogin = config.page.AlwaysRequestLogin;
        accessFetcher.disableOnNoToken = false;
        accessFetcher.bearerCookieName = config.client.BearerCookieName;
        fetcher = accessFetcher;
    }

    return fetcher;
}