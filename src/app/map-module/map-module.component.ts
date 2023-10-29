import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat, transformExtent } from 'ol/proj';
import OSM from 'ol/source/OSM';
import { ZoomSlider } from 'ol/control'
import { Tile, Vector } from 'ol/layer';
import VectorImageLayer from 'ol/layer/VectorImage';
import Text from 'ol/style/Text';
import { Vector as vectorSource } from 'ol/source';
import { TileWMS } from 'ol/source'
import { HttpClient, HttpHeaders } from '@angular/common/http';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import * as echarts from 'echarts';
import { ChartSeries } from './map-module.model';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
@Component({
    selector: 'app-map-module',
    templateUrl: './map-module.component.html',
    styleUrls: ['./map-module.component.css']
})
export class MapModuleComponent implements OnInit, AfterViewInit {

    constructor(private http: HttpClient) { }
    ngAfterViewInit(): void {

    }
    public map!: Map;
    public rasterLayer: any;
    public rasterSource: any;
    public vectorLayer: any;
    public vectorLayerCountry: any;
    public chart: any = {};
    public chartData: Array<ChartSeries> = new Array<ChartSeries>();
    public dataModel = [{
        label: 'Male',
        prop: 'MALE'
    },
    {
        label: 'Female',
        prop: 'FEMALE'
    },
    {
        label: 'Employed',
        prop: 'EMPLOYED'
    },
    {
        label: 'Unemployed',
        prop: 'UNEMPLOY'
    },
    {
        label: 'Families',
        prop: 'FAMILIES'
    }
        ,
    {
        label: 'Household',
        prop: 'HOUSHOLD'
    }
        ,
    {
        label: 'Workers',
        prop: 'WORKERS'
    }
        ,
    {
        label: 'Persons',
        prop: 'PERSONS'
    }
    ]
    ngOnInit() {
        this.initMap()
        this.onMapClick();
    }
    initMap() {
        this.map = new Map({
            target: 'map',
            view: new View({
                projection: 'EPSG:3857',
                zoom: 5,
                center: fromLonLat([-73.4829, 40.84082]),
                // extent: transformExtent([68.1766451354, 7.96553477623, 97.4025614766, 35.4940095078], "EPSG:4326", "EPSG:3857")

            }),
            pixelRatio: 1,
            layers: [new TileLayer({
                source: new OSM()
            })],


        });
        this.map.addControl(new ZoomSlider())
        this.addRasterLayer();
        this.addVectorLayer();
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

        this.rasterLayer.set('layerName', 'rasterLayer')
        this.map.addLayer(this.rasterLayer)
    }
    onMapClick() {
        this.map.on('singleclick', (e) => {
            this.initChart()
            console.log('click');

            let resolution = this.map.getView().getResolution();
            let proj = 'EPSG:3857';
            let format = {
                'INFO_FORMAT': 'application/json'
            }
            this.map.forEachFeatureAtPixel(e.pixel, (feature: any, layer: any) => {
                console.log(feature);
                if (feature instanceof Feature) {
                    this.chartData = [];
                    let featureProp: any = feature.getProperties();
                    this.dataModel.forEach((model) => {
                        this.chartData.push({ name: model.label, value: featureProp[model.prop] })
                    })
                    this.initChart();

                }

            })
            this.map.forEachLayerAtPixel(e.pixel, (layer) => {
                if (layer && layer.get('layerName') == 'rasterLayer') {
                    let featureURL = this.rasterLayer.getSource().getFeatureInfoUrl(e.coordinate, resolution, proj, format);
                    console.log(featureURL);
                    let _headers = new HttpHeaders();
                    _headers.set('Access-Control-Allow-Origin', 'http://localhost:4200')
                    this.http.get(featureURL, {
                        headers: _headers
                    }).subscribe((response) => {
                        console.log(response);

                    })
                }


            })
        })
    }
    addVectorLayer() {
        this.vectorLayer = new VectorImageLayer({
            zIndex: 2,
            source: new vectorSource({
                url: 'http://localhost:9004/geoserver/topp/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=topp:states&maxFeatures=50&outputFormat=application/json',
                format: new GeoJSON()
            }),

        });
        // this.map.addLayer(this.vectorLayer)
        this.vectorLayerCountry = new VectorImageLayer({
            zIndex: 1,
            source: new vectorSource({
                url: 'http://localhost:9004/geoserver/US_Data/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=US_Data:USA_Country&maxFeatures=50&outputFormat=application/json',
                format: new GeoJSON(),
            }),
            style: (feature) => {
                return new Style({
                    stroke: new Stroke({ color: 'black', width: 3 }),
                    text: new Text({
                        font: 'bold 20px "Fira Sans"',
                        text: feature.getProperties()['NAME_ENGLI'].toString()
                    })
                })
            }
        });
        this.map.addLayer(this.vectorLayerCountry)
    }
    initChart() {
        let chartEle = document.getElementById('chart');
        this.chart = echarts.init(chartEle);
        const option = {
            title: {
                text: 'Referer of a Website',
                subtext: 'Fake Data',
                left: 'center'
            },
            tooltip: {
                trigger: 'item'
            },
            legend: {
                orient: 'vertical',
                left: 'left'
            },
            series: [
                {
                    name: 'Access From',
                    type: 'pie',
                    radius: '50%',
                    // data: [
                    //     { value: 1048, name: 'Search Engine' },
                    //     { value: 735, name: 'Direct' },
                    //     { value: 580, name: 'Email' },
                    //     { value: 484, name: 'Union Ads' },
                    //     { value: 300, name: 'Video Ads' }
                    // ],
                    data: this.chartData,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };
        this.chart.setOption(option)
    }

}
