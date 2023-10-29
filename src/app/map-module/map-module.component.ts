import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import * as echarts from 'echarts';
import { Map, View } from 'ol';
import { ZoomSlider } from 'ol/control';
import GeoJSON from 'ol/format/GeoJSON';
import { Tile } from 'ol/layer';
import TileLayer from 'ol/layer/Tile';
import VectorImageLayer from 'ol/layer/VectorImage';
import { fromLonLat } from 'ol/proj';
import { TileWMS, Vector as vectorSource } from 'ol/source';
import OSM from 'ol/source/OSM';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import { ChartSeries, CountryTableModel, StateTableModal } from './map-module.model';
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
    public chartHeader: string = ''
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
    stateTableData: StateTableModal = new StateTableModal()
    countryTableData: CountryTableModel = new CountryTableModel();
    showCountryTable: boolean = false;
    showStateTable: boolean = false;
    public minValue: string = ''
    public maxValue: string = ''
    public filterString: string = ''
    ngOnInit() {
        this.initMap()
        this.onMapClick();
        // this.onPointerMove();
        this.onZoomChange();
    }
    initMap() {
        this.map = new Map({
            target: 'map',
            view: new View({
                projection: 'EPSG:3857',
                zoom: 2,
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
        var _feature;
        this.map.on('singleclick', (e) => {
            if (_feature) {
                _feature.setStyle(undefined);
                _feature = undefined;
            }
            var highLight = new Style({
                stroke: new Stroke({ color: 'white', width: 2 })
            })
            this.initChart()
            console.log('click');

            let resolution = this.map.getView().getResolution();
            let proj = 'EPSG:3857';
            let format = {
                'INFO_FORMAT': 'application/json'
            }
            this.map.forEachFeatureAtPixel(e.pixel, (feature: any, layer: any) => {

                let featureProp: any = feature.getProperties();
                if (layer.get('name') == 'USCountry') {
                    this.showCountryTable = true;
                    this.showStateTable = false;
                    this.chartData = [];
                    this.chartData.push({ name: 'Population', value: featureProp['POP2000'] });
                    this.chartHeader = featureProp['NAME_ENGLI']
                    feature.setStyle(this.addStyle(feature, 'NAME_ENGLI', 'red', 'rgba(175, 209, 237,0.4)'))
                    this.countryTableData.populationPerSqKm = featureProp['POPSQKM']
                    this.countryTableData.totalArea = featureProp['SQKM']
                    this.countryTableData.totalPopulation = featureProp['POP2000']
                }
                else if (layer.get('name') == 'USStates') {
                    this.showCountryTable = false;
                    this.showStateTable = true;
                    this.chartData = [];
                    this.dataModel.forEach((model) => {
                        this.chartData.push({ name: model.label, value: featureProp[model.prop] })
                    });
                    feature.setStyle(this.addStyle(feature, 'STATE_NAME', 'red', 'rgba(175, 209, 237,0.4)'));
                    this.chartHeader = featureProp['STATE_NAME'];
                    this.stateTableData.male = featureProp['MALE']
                    this.stateTableData.female = featureProp['FEMALE']
                    this.stateTableData.employed = featureProp['EMPLOYED']
                    this.stateTableData.unemployed = featureProp['UNEMPLOY']
                    this.stateTableData.families = featureProp['FAMILIES']


                }

                _feature = feature;
                this.initChart();

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
                url: 'http://localhost:9004/geoserver/topp/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=topp:states&outputFormat=application/json',
                format: new GeoJSON(),

            }),
            style: (feature) => {
                return this.addStyle(feature, 'STATE_NAME', 'black')
            }

        });
        this.vectorLayer.set('name', 'USStates')
        this.map.addLayer(this.vectorLayer)
        this.vectorLayerCountry = new VectorImageLayer({
            zIndex: 1,
            source: new vectorSource({
                url: 'http://localhost:9004/geoserver/US_Data/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=US_Data:USA_Country&maxFeatures=50&outputFormat=application/json',
                format: new GeoJSON(),
            }),
            style: (feature) => {
                return this.addStyle(feature, 'NAME_ENGLI', 'black')
            },
        });
        this.vectorLayerCountry.set('name', 'USCountry')
        this.map.addLayer(this.vectorLayerCountry)
    }
    initChart() {
        let chartEle = document.getElementById('chart');
        this.chart = echarts.init(chartEle);
        const option = {
            title: {
                text: this.chartHeader,
                // subtext: 'Fake Data',
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
    onPointerMove() {
        var highLight = new Style({
            stroke: new Stroke({ color: 'white', width: 2 })
        })
        var _feature: any;
        this.map.on('pointermove', e => {
            if (_feature) {
                console.log('no feature');
                _feature = undefined

            }
            this.map.forEachFeatureAtPixel(e.pixel, (feature: any) => {
                _feature = feature
                _feature.setStyle(highLight);
                if (!feature) {
                    console.log('no feature');

                }
                else {
                    console.log('yes feature');

                }
            })

        })
    }
    onZoomChange() {
        this.map.on('moveend', e => {
            console.log(this.map.getView().getZoom());

            if (this.map.getView().getZoom() >= 3) {
                this.vectorLayer.setVisible(true)
                this.vectorLayerCountry.setVisible(false)
                this.showCountryTable = false;
                this.showStateTable = true;
            }
            else {
                this.vectorLayer.setVisible(false)
                this.vectorLayerCountry.setVisible(true)
                this.showCountryTable = true;
                this.showStateTable = false;
            }
        })
    }
    addStyle(feature, textProp, strokeColor, fillColor = 'rgba(176, 186, 194,0.4)') {
        return new Style({
            stroke: new Stroke({ color: strokeColor, width: 3 }),
            fill: new Fill({ color: fillColor }),
            text: new Text({
                font: 'bold 20px "Fira Sans"',
                text: feature.getProperties()[textProp].toString()
            })
        })
    }
    applyFilter() {
        if (this.minValue && this.maxValue) {
            this.filterString = "PERSONS>'" + this.minValue + "' and PERSONS<'" + this.maxValue + "'";
            let url = "http://localhost:9004/geoserver/topp/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=topp:states&PROPERTY_NAME=(PERSONS)&CQL_FILTER=" + this.filterString + "&outputFormat=application/json"
            this.vectorLayer.getSource().setUrl(url);
            this.vectorLayer.getSource().refresh();
            console.log(this.filterString);
        }
    }
    clearFilter(){
        let url = "http://localhost:9004/geoserver/topp/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=topp:states&PROPERTY_NAME=(PERSONS)&outputFormat=application/json"
        this.vectorLayer.getSource().setUrl(url);
        this.vectorLayer.getSource().refresh();

    }


}
