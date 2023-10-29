import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapModuleComponent } from './map-module.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TabsModule, TabsetConfig } from 'ngx-bootstrap/tabs';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    TabsModule.forRoot(),
    FormsModule

  ],
  declarations: [MapModuleComponent],
  exports:[
    MapModuleComponent
  ],
  providers:[
    TabsetConfig
  ]
})
export class MapModuleModule { }
