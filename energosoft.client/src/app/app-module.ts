import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // Нужно для [(ngModel)]
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Taiga UI
import { TuiRootModule, TuiDialogModule, TuiAlertModule } from '@taiga-ui/core';
import { TuiTableModule, TuiTablePaginationModule } from '@taiga-ui/addon-table';
import { TuiInputModule } from '@taiga-ui/kit';

import { App } from './app'; // Ссылка на ваш класс из app.ts

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    TuiRootModule,
    TuiTableModule,
    TuiTablePaginationModule,
    TuiInputModule
  ],
  bootstrap: [App]
})
export class AppModule { }
