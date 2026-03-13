import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config'
import { App } from './app/app';
import { App2 } from './app/app2';

bootstrapApplication(App2, appConfig).catch((err) => console.error(err));
