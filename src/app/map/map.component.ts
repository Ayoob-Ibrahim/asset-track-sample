import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Optional,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Icon, Stroke, Style } from 'ol/style';
import { MqttClientService } from '../services/mqtt-client.service';
import { Subscription } from 'rxjs';
import { banToCh, chennaiToCoimbatore, chennaiToMadurai } from '../mock';
import { Router } from '@angular/router';
import { FlightsService } from '../services/flights.service';
import { LineString } from 'ol/geom';
import { IMqttMessage } from 'ngx-mqtt';
import { latng } from '../app.component';
import { Coordinate } from 'ol/coordinate';

type trackData = {
  asset: string;
  index: number;
};
export type selectedFlightStatus = {
  index: number;
  asset: string;
  data: latng;
};

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input('isTrack') isTrack = false;
  @Input('trackData') trackData!: trackData;
  @Output('clickMarker') clickMarker = new EventEmitter<selectedFlightStatus>();
  private selectedFlightStatus!: selectedFlightStatus;
  private map!: Map;
  private vectorSource!: VectorSource;
  private vehicleFeature!: Feature;
  private vectorLayer!: VectorLayer<any>;
  private route: [number, number][] = [];
  private mqttSubscription!: Subscription;
  locations = [
    [80.257, 13.0602],
    [80.2497, 12.9791],
    [80.2707, 13.0806],
    [80.164, 12.9816],
    [80.2213, 12.9887],
  ];
  features: { [name: string]: Feature } = {};
  constructor(
    @Optional() private mqttClientService: MqttClientService,
    private router: Router,
    private flightService: FlightsService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
    this.addLocations();
  }
  private initMap(): void {
    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: new Style({
        image: new Icon({
          src: 'assets/vehicle-icon.png', // Path to your marker icon
          anchor: [0.5, 1],
          scale: 0.58,
        }),
      }),
    });
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        this.vectorLayer,
      ],
      view: new View({
        center: fromLonLat([80.2707, 13.0837]), // Center the map on Chennai
        zoom: 8
      }),
    });
    this.map.on('click', (event) => {
      this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
        const clickedFeatureId = feature.get('id');
        console.log(clickedFeatureId, 'clickedFeatureId', feature);
        this.handleMarkerClick(clickedFeatureId);
      });
    });
  }
  private handleMarkerClick(id: string): void {
    let asset = id;
   // checking clicked marker different asset
   // checking already any subsccription happened 
    if (this.selectedFlightStatus && (this.selectedFlightStatus.asset !== id) && (this.assetSubscription) && (!this.assetSubscription.closed))
          this.stopAssetTrack(this.selectedFlightStatus.asset);
    // checking clicked marker different asset
   // checking already any subsccription happened 
    let flightSts = this.flightService.allFlightsStatus.filter(
      (flights) => flights.flightId === asset
    );
    let flightRoutes = this.flightService.getFlightRoutes(flightSts[0]);
    console.log(flightRoutes, 'flightrouter');
    this.selectedFlightStatus = {
      index: 0,
      asset: asset,
      data: flightRoutes[0],
    };
    this.clickMarker.emit(this.selectedFlightStatus);
  }

  private addLocations(): void {
    let centerL: number[] = [];
    this.flightService.getFlightsStatus((location, flightData, flightIndex) => {
      this.features[flightData.flightId] = new Feature({
        geometry: new Point(fromLonLat(location)),
        id: `${flightData.flightId}`,
      });
      this.vectorLayer
        .getSource()
        ?.addFeature(this.features[flightData.flightId]);
      if (flightIndex == 2) {
        centerL = [...location];
      }
    });
    this.setCenter(centerL);
  }
  setCenter(centerL: number[]) {
    this.map.getView().setCenter(fromLonLat(centerL));
  }
  assetSubscription!: Subscription;
  trackAsset(id: string) {
    if (this.assetSubscription && !this.assetSubscription.closed)
      this.stopAssetTrack(id);
    this.assetSubscription = this.mqttClientService
      .doSubscribe({ topic: id, qos: 0 })
      .subscribe((res: IMqttMessage) => {
        let payload: latng = this.unit8ArrToJson(res.payload);
        this.selectedFlightStatus.data = { ...payload };
        this.clickMarker.emit(this.selectedFlightStatus);

        console.log(this.features[id], 'resssss of messseajfaei');
        this.updateFeature(id, [payload.lng, payload.lat]);
      });
  }
  unit8ArrToJson(uint8Array: Uint8Array) {
    return JSON.parse(new TextDecoder().decode(uint8Array));
  }
  lineCoordinates: Coordinate[] = [];
  addLineFeature(pathCoordinates: number[]) {
    this.features['line'] = new Feature({
      geometry: new LineString(this.lineCoordinates),
      id: 'line',
    });

    const pathStyle = new Style({
      stroke: new Stroke({
        color: '#0075ff',
        width: 2,
        lineDash: [4, 8],
      }),
    });

    this.features['line'].setStyle(pathStyle);
    this.vectorSource.addFeature(this.features['line']);
  }
  updateFeature(id: string, pathCoordinates: number[]) {
    if (this.features['line'] == undefined)
      this.addLineFeature(pathCoordinates);
    //  let assetFeature= this.vectorSource.getFeatureById(id);
    const assetGeometry = this.features[id].getGeometry() as Point;
    const pathGeometry = this.features['line'].getGeometry() as LineString;
    // let angle =this.getDirection(assetGeometry.getCoordinates(),fromLonLat(pathCoordinates));
    // console.log(Math.round(angle) ,' assetFeature?.getGeometry()');
    this.updateAssetStyle(this.features[id], 0);
    assetGeometry.setCoordinates(fromLonLat(pathCoordinates));
    this.lineCoordinates.push(fromLonLat(pathCoordinates));
    pathGeometry.setCoordinates(this.lineCoordinates);
    this.setCenter(pathCoordinates);

    // let  pathCoordinates=[0,0];
  }
  stopAssetTrack(id: string) {
    if( !this.assetSubscription ||  this.assetSubscription?.closed)return console.log('No One Asset In Tracking.');
    
    this.vectorSource.removeFeature(this.features['line']);
    this.features[id].setStyle(
      new Style({
        image: new Icon({
          src: 'assets/vehicle-icon.png', // Path to your marker icon
          anchor: [0.5, 1],
          scale: 0.58,
        }),
      })
    );
    delete this.features['line'];
    this.lineCoordinates = [];
    this.assetSubscription.unsubscribe();
  }

  ngOnDestroy(): void {
    this.mqttSubscription?.unsubscribe();
    this.mqttClientService.destroyConnection();
  }
  updateAssetStyle(asset: Feature, angle: number): void {
    // Example: Change the rotation of the asset icon
    let style = asset.getStyle() as Style;
    let op = 0.8;
    if (style) {
      op = style.getImage()?.getOpacity() || 0.8;
    }

    const newMarker = new Style({
      image: new Icon({
        src: 'assets/vehicle-ontrack.png', // Path to your new marker image
        scale: 0.3,
        opacity: op == 1 ? 0.8 : 1, // Adjust opacity if needed
        rotateWithView: true,
        // rotation:angle|| 0,
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
      }),
    });
    asset.setStyle(newMarker);
    // Notify the layer or map that the style has changed
    this.vectorSource.changed();
  }
  getDirection(fromCoords: Coordinate, toCoords: Coordinate): number {
    const [fromLon, fromLat] = fromCoords;
    const [toLon, toLat] = toCoords;

    // Convert degrees to radians
    const degToRad = (deg: number) => deg * (Math.PI / 180);

    // Calculate differences in longitude and latitude
    const dLon = degToRad(toLon - fromLon);
    const fromLatRad = degToRad(fromLat);
    const toLatRad = degToRad(toLat);

    // Calculate y and x components of the bearing
    const y = Math.sin(dLon) * Math.cos(toLatRad);
    const x =
      Math.cos(fromLatRad) * Math.sin(toLatRad) -
      Math.sin(fromLatRad) * Math.cos(toLatRad) * Math.cos(dLon);

    // Calculate the bearing in degrees
    let bearing = Math.atan2(y, x);
    bearing = bearing * (180 / Math.PI); // Convert radians to degrees
    bearing = (bearing + 360) % 360; // Normalize to a 0-360 degree range
    return bearing;
  }
}
