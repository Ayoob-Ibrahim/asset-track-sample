import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MqttClientService } from './services/mqtt-client.service';
import { MapComponent, selectedFlightStatus } from './map/map.component';
import { FlightsService } from './services/flights.service';
import { Subscription, delay, from, interval, map, tap } from 'rxjs';
export type latng= {"lat": number, "lng":number, "speed": number}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit,OnDestroy{
  @ViewChild('mapComponent')mapComponent!:MapComponent;
  title = 'mqttClient';
  mapcard={
    on:false,
   title:'',
   description:'',
   timestamp:undefined,
   img:'asset1',
   id:'',
   currentData:{
    lat:0,
    lng:0,
    speed:0
   }
  }
  markerClicked(event:selectedFlightStatus){
    if(this.mapcard.id!=event.asset )this.updateCard(event);
   else {
    this.mapcard.on=true;
    this.mapcard.currentData= {...event.data};
   }
 
}
updateCard(event:selectedFlightStatus){
  let selectedFlight=this.flightService.allFlightsStatus.filter(flights=>flights.flightId==event.asset)[0]
 if(!selectedFlight)return;
 this.mapcard.on=true;
 this.mapcard.title = selectedFlight.flightName;
 this.mapcard.description = selectedFlight.routeStatus;
 this.mapcard.img = selectedFlight.img;
 this.mapcard.id=selectedFlight.flightId;
 this.mapcard.currentData = {...event.data}
 console.log(this.mapcard,'amajdj');
 
}
  constructor(private flightService:FlightsService,private mqttService:MqttClientService){
    
  }
  subscriptionArray:Subscription[]=[];
  ngOnDestroy(): void {
    // this.subscriptionArray.forEach(sub=>sub.unsubscribe());
    this.mqttService.doUnsubscribeToPublishForAssets();
    // this.flightService.allFlightsStatus.forEach(flight=>this.allSubs[flight.flightId].unsubscribe());
    this.mqttService.destroyConnection();
    console.log('ondestroy',this.subscriptionArray,this.allSubs);
    
  }
  ngOnInit(): void {
    // this.mqtt.createConnection();
    // this.mqtt.doSubscribe();
    // this.mqtt.doPublish();
   this.mqttService.doPublishForAssets();
  }
//   doPublishForAssets(){
// let asset1 = this.flightService.getFlightRoutes(this.flightService.allFlightsStatus[0]);
// let asset2 = this.flightService.getFlightRoutes(this.flightService.allFlightsStatus[1]);
// let asset3 = this.flightService.getFlightRoutes(this.flightService.allFlightsStatus[2]);
// let subscribe1 = interval(3000).subscribe(counts=>{
//   // console.log(asset1,'asse1');
//   if(counts<asset1.length){
//     let payload  = asset1[counts];
//     this.publishFunciton(0,payload);
//   }else subscribe1.unsubscribe()
// })
// let subscribe2 = interval(3000).subscribe(counts=>{
//   // console.log(asset2,'asse2');
//   if(counts<asset2.length){
//     let payload  = asset2[counts];
//     this.publishFunciton(1,payload);
//   }else subscribe2.unsubscribe();
// })
// let subscribe3 = interval(3000).subscribe(counts=>{
//   // console.log(asset3,'asse3');
//   if(counts<asset3.length){
//     let payload  = asset3[counts];
//     this.publishFunciton(2,payload);
//   }else subscribe3.unsubscribe()
// })
// this.subscriptionArray.push(subscribe1,subscribe2,subscribe3);
//   }
  publishFunciton(flightI:number,payload:latng){
    this.mqttService.doPublish({topic:this.flightService.allFlightsStatus[flightI]['flightId'],qos:0,payload:JSON.stringify(payload)})
 //`${payload.lat},${payload.lng}&${payload.speed}`
  }
  allSubs:{[name:string]:Subscription}={}
  doPublishForAssets(){
    this.flightService.allFlightsStatus.forEach((echFlight,flighI)=>{
      let asset = this.flightService.getFlightRoutes(echFlight);
    this.allSubs[echFlight.flightId]= interval(3000).subscribe(counts=>{
        // console.log(asset1,'asse1');
        if(counts<asset.length){
          let payload  = asset[counts];
          this.publishFunciton(flighI,payload);
        }else this.allSubs[echFlight.flightId].unsubscribe()
      })
    })
      }
  onTracking(id:string){
   console.log(id,'idjd');
   this.mapComponent.trackAsset(id);
  }
  stopTracking(id:string){
    this.mapComponent.stopAssetTrack(id);
    this.mapcard.on=false;
  }
}
