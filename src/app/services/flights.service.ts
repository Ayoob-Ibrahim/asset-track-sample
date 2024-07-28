import { Injectable } from "@angular/core";
import { banToCh, chennaiToCoimbatore, chennaiToMadurai } from "../mock";
type flightsatus={
    flightName:string;
    flightStatus:string,
    flightId:string,
    route:number,
    routeStatus:string,
    img:string
}
@Injectable({
    providedIn: 'root'
})
export class FlightsService{
     private flightsRoute=[chennaiToCoimbatore,banToCh,chennaiToMadurai];
     allFlightsStatus:flightsatus[]=[{
        flightName:'Indigo',
        flightStatus:'On Time',
        flightId:'asset/1',
        route:0,
        routeStatus:'Fight On the way Chennai to Coimbatore',
        img:'asset1'

    },{
        flightName:'Jet Airways',
        flightStatus:'On Time',
        flightId:'asset/2',
        route:1,
routeStatus:'Fight On the way Bangalore to Chennai',
 img:'asset2'
        
    },{
        flightName:'Indigo',
        flightStatus:'On Time',
        flightId:'asset/3',
        route:2,
        routeStatus:'Fight On the way Chennai to Madurai',
         img:'asset1'
        
    }];
    getFlightsStatus(callBack=(curlocation:number[],flightData:flightsatus,flightIndex:number)=>{}){
        this.allFlightsStatus.forEach((flight,ind)=>{
            let flightRoute = this.flightsRoute[flight.route];
            // let rIndex=Math.round( Math.random()*(flightRoute.length/2));
            let randomRoute = flightRoute[0];
            let location = [randomRoute.lng,randomRoute.lat];
            console.log(ind,location,'locations');
            callBack(location,flight,ind);
          })
    }
    getFlightRoutes(flight:flightsatus){
        return this.flightsRoute[flight.route]
    }
}