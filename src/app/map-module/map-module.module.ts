import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapModuleComponent } from './map-module.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  declarations: [MapModuleComponent],
  exports:[
    MapModuleComponent
  ]
})
export class MapModuleModule { }
