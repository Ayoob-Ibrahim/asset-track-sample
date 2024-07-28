import { Inject, Injectable } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import {
  IMqttClient,
  IMqttMessage,
  IMqttServiceOptions,
  IPublishOptions,
  MqttService,
} from 'ngx-mqtt';
import { IClientSubscribeOptions } from 'mqtt-browser';
import { FlightsService } from './flights.service';
import { latng } from '../app.component';
import { MQTT_SERVICE_OPTIONS } from '../app.module';

@Injectable()
export class MqttClientService {
  curSubscription$!: Subscription;
  client!: MqttService;
  // connection = {
  //   hostname: 'localhost',
  //   port: 9001,
  //   path: '/mqtt',
  // };
  qosList = [
    { label: 0, value: 0 },
    { label: 1, value: 1 },
    { label: 2, value: 2 },
  ];
  isConnection = false;

  constructor( private _mqttService: MqttService,private flightService:FlightsService) {
    this.client = this._mqttService;
    this.client.state.subscribe(sta=>{
      if(sta<2){
        this.isConnection = false;
      }else this.isConnection = true;
      console.log(sta,'stateaachaaskdfkjlkhafsdkljkjasdshh,h,',this.client);
      
    })
 
   
  }

  createConnection() {
    try {
      this.client.connect(MQTT_SERVICE_OPTIONS as IMqttServiceOptions);
    } catch (error) {
      console.log('mqtt.connect error', error);
    }
    this.client.onError.subscribe((err) => {
      this.isConnection = false;
      console.log('connection failure', err);
    });
    this.client.onConnect.subscribe((packetevent) => {
      this.isConnection = true;
      console.log('connection success', packetevent);
    });
  }

  doSubscribe(subscription:{topic:string,qos:number}) {
    const { topic, qos } = subscription;
  return this.client
      .observe(topic, { qos } as IClientSubscribeOptions);
  }

  doUnSubscribe() {
    this.curSubscription$?.unsubscribe();
    
  }

  doPublish(publishOptions: {topic:string,qos:number,payload:string}) {
    const { topic, qos,payload } = publishOptions;
    if(this.isConnection)
    this.client?.unsafePublish(topic, payload, { qos } as IPublishOptions);
  }

  destroyConnection() {
    try {
      this.client?.disconnect(true);
      this.isConnection = false;
      console.log('Successfully disconnected!');
    } catch (error: any) {
      console.log('Disconnect failed', error.toString());
    }
  }
  allPublishSubscribes:{[name:string]:Subscription}={};
  doPublishForAssets(){
    this.flightService.allFlightsStatus.forEach((echFlight,flighI)=>{
      let asset = this.flightService.getFlightRoutes(echFlight);
    this.allPublishSubscribes[echFlight.flightId]= interval(3000).subscribe(counts=>{
        // console.log(asset1,'asse1');
        if(counts<asset.length){
          let payload  = asset[counts];
          this.publishFunciton(flighI,payload);
        }else this.doUnsubscribeToPublishForAssets();
      },err=>console.log(err,echFlight.flightId)
      )
    })
      }
      doUnsubscribeToPublishForAssets(){
        this.flightService.allFlightsStatus.forEach((echFlight,flighI)=>this.allPublishSubscribes[echFlight.route].unsubscribe())
      }
      publishFunciton(flightI:number,payload:latng){
        this.doPublish({topic:this.flightService.allFlightsStatus[flightI]['flightId'],qos:0,payload:JSON.stringify(payload)})
     //`${payload.lat},${payload.lng}&${payload.speed}`
      }
}
