import { setSwapMapVisible, setOtherMapVisible, notifyUser } from './ui';
import { getGoogleMapsAlreadyLoaded, setOtherMapsAlreadyLoaded } from './loadState';

export { addMarkerOther, clearAllMarkersOther, initOtherMap, otherMap };


//OTHER MAP

var otherMap, markersOther;

/**  creates layers from different map providers and adds them to the map */
function initOtherMap(force) {

    if (!force) {
        setOtherMapsAlreadyLoaded(true);
        if (!getGoogleMapsAlreadyLoaded())
            return setOtherMapVisible();
        else
            return setSwapMapVisible();
    }

    if (typeof L === 'undefined')
        return notifyUser("failed to load other maps", true);

    var wheatpasteLayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
            id: 'mapbox.wheatpaste',
            attribution: null
        }),
        tonerLayer = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
            attribution: null,
            subdomains: 'abcd',
            minZoom: 0,
            maxZoom: 20,
            ext: 'png'
        }),
        watercolorLayer = L.layerGroup([
            L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
                attribution: null,
                subdomains: 'abcd',
                minZoom: 1,
                maxZoom: 16,
                ext: 'jpg'
            }),
            L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.{ext}', {
                attribution: null,
                subdomains: 'abcd',
                minZoom: 0,
                maxZoom: 20,
                ext: 'png'
            })
        ]),
        oceanbaseLayer = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}', {
            attribution: null,
            maxZoom: 13
        }),
        thunderforestSpinalLayer = L.tileLayer('http://{s}.tile.thunderforest.com/spinal-map/{z}/{x}/{y}.png?apikey=db5ae1f5778a448ca662554581f283c5', {
            attribution: null,
            apikey: 'db5ae1f5778a448ca662554581f283c5',
            maxZoom: 22
        }),
        positronLayer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            attribution: null,
            subdomains: 'abcd',
            maxZoom: 19
        }),
        satelliteLayer = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: null
        });


    markersOther = L.layerGroup();

    otherMap = L.map('mapOther', {
        center: [37.7881209, -122.3954958],
        zoom: 12,
        attributionControl: false,
        layers: [positronLayer, markersOther]
    });

    var baseLayers = {
        "Positron": positronLayer,
        "WaterColor": watercolorLayer,
        "WheatPaste": wheatpasteLayer,
        "Toner": tonerLayer,
        "Ocean Base": oceanbaseLayer,
        "AC/CD": thunderforestSpinalLayer,
        "Satellite": satelliteLayer
    };

    L.control.layers(baseLayers).addTo(otherMap);
}


function addMarkerOther(lat, lng, title, infoContent) {
    lat = parseFloat(lat);
    lng = parseFloat(lng);
    L.marker([lat, lng]).bindTooltip(title).bindPopup(infoContent).addTo(markersOther);
}


function clearAllMarkersOther() {
    markersOther.clearLayers();
}