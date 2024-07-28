import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';

import { MapComponent } from './map/map.component';
import { ButtonModule } from 'primeng/button';

import { IMqttServiceOptions, MqttModule,IMqttClient } from 'ngx-mqtt';
import { MqttClientService } from './services/mqtt-client.service';
import { ToolbarModule } from 'primeng/toolbar';
import { AvatarModule } from 'primeng/avatar';
import { GlobalErrorHandle } from './services/global-error-handle.service';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { GlobalHttpInterceptor } from './services/global-http-interceptor.serive';
// import { RouterModule } from '@angular/router';
export const MQTT_SERVICE_OPTIONS: IMqttServiceOptions = {
  hostname: 'localhost',
  port: 9001,
  path: '/mqtt',
};
@NgModule({
  declarations: [AppComponent, MapComponent],
  imports: [
    BrowserModule,
    ButtonModule,
    BrowserAnimationsModule,
    ToolbarModule,
    AvatarModule,
    MqttModule.forRoot(MQTT_SERVICE_OPTIONS),
  ],
  providers: [
    
    MqttClientService,
    { provide: ErrorHandler, useClass: GlobalErrorHandle },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: GlobalHttpInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
