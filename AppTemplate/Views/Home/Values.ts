import * as standardCrudPage from 'hr.widgets.StandardCrudPage';
import * as startup from 'Client/Libs/startup';
import * as deepLink from 'hr.deeplink';
import { ValueCrudInjector } from 'Client/Libs/ValueCrudInjector';

var injector = ValueCrudInjector;

var builder = startup.createBuilder();
deepLink.addServices(builder.Services);
standardCrudPage.addServices(builder, injector);
standardCrudPage.createControllers(builder, new standardCrudPage.Settings());