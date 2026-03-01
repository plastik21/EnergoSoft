import { Component } from '@angular/core';
import { TuiRoot } from '@taiga-ui/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    TuiRoot
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent {
  title = 'energosoft.client2';
}
