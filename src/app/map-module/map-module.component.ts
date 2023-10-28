import { Component, OnInit } from '@angular/core';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat, transformExtent } from 'ol/proj';
import OSM from 'ol/source/OSM';
import { ZoomSlider } from 'ol/control'
import { Tile } from 'ol/layer';
import { TileWMS } from 'ol/source'
import { HttpClient, HttpHeaders } from '@angular/common/http'
@Component({
    selector: 'app-map-module',
    templateUrl: './map-module.component.html',
    styleUrls: ['./map-module.component.css']
})
export class MapModuleComponent implements OnInit {

    constructor(private http: HttpClient) { }
    public map!: Map;
    public rasterLayer: any;
    public rasterSource: any;
    ngOnInit() {
        this.initMap();
        this.onMapClick();
    }
    initMap() {
        this.map = new Map({
            target: 'map',
            view: new View({
                projection: 'EPSG:3857',
                zoom: 2,
                center: fromLonLat([78.8718, 21.7679]),
                extent: transformExtent([68.1766451354, 7.96553477623, 97.4025614766, 35.4940095078], "EPSG:4326", "EPSG:3857")

            }),
            pixelRatio: 1,
            layers: [new TileLayer({
                source: new OSM()
            })],


        });
        this.map.addControl(new ZoomSlider())
        this.addRasterLayer()
    }
    addRasterLayer() {
        this.rasterSource = new TileWMS({
            url: 'http://localhost:9004/geoserver/Indian-Boundaries/wms',
            params: {
                'LAYERS': 'Indian-Boundaries:Boundary-Layer-Grp',
                'SRS': 'EPSG:3857',
                'VERSION': '1.1.1'
            }
        })
        this.rasterLayer = new Tile({
            source: this.rasterSource
        });
        this.map.addLayer(this.rasterLayer)
    }
    onMapClick() {
        this.map.on('singleclick', (e) => {
            console.log('click');

            let resolution = this.map.getView().getResolution();
            let proj = 'EPSG:3857';
            let format = {
                'INFO_FORMAT': 'application/json'
            }
            this.map.forEachLayerAtPixel(e.pixel, (feature: any, layer: any) => {
                let featureURL = this.rasterLayer.getSource().getFeatureInfoUrl(e.coordinate, resolution, proj, format);
                console.log(featureURL);
                let _headers = new HttpHeaders();
                _headers.set('Access-Control-Allow-Origin', 'http://localhost:4200')
                this.http.get(featureURL, {
                    headers: _headers
                }).subscribe((response) => {
                    console.log(response);

                })

            })
        })
    }

}
