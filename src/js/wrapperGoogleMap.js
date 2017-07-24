import { setSwapMapVisible, setGoogleMapVisible, notifyUser } from './ui';
import { setGoogleMapsAlreadyLoaded, getOtherMapsAlreadyLoaded } from './loadState';

export { addMarkerGoogle, clearAllMarkersGoogle, initGoogleMap, googleMap, geocoderGoogle };


//GOOGLE MAP

var googleMap,
    markersGoogle = [],
    geocoderGoogle,
    infowindowGoogle;

/**  creates the objects necessary to show google maps, and adds a new styled layer */
function initGoogleMap(force) {

    if (!force) {
        setGoogleMapsAlreadyLoaded(true);
        if (!getOtherMapsAlreadyLoaded())
            return setGoogleMapVisible();
        else
            return setSwapMapVisible();
    }

    if (typeof google === 'undefined')
        return notifyUser("Google maps failed to load", true);

    geocoderGoogle = new google.maps.Geocoder();
    infowindowGoogle = new google.maps.InfoWindow();

    var darkMapType = new google.maps.StyledMapType(
        [{
            elementType: 'geometry',
            stylers: [{
                color: '#242f3e'
            }]
        }, {
            elementType: 'labels.text.stroke',
            stylers: [{
                color: '#242f3e'
            }]
        }, {
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#746855'
            }]
        }, {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#d59563'
            }]
        }, {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#d59563'
            }]
        }, {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{
                color: '#263c3f'
            }]
        }, {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#6b9a76'
            }]
        }, {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{
                color: '#38414e'
            }]
        }, {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{
                color: '#212a37'
            }]
        }, {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#9ca5b3'
            }]
        }, {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{
                color: '#746855'
            }]
        }, {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{
                color: '#1f2835'
            }]
        }, {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#f3d19c'
            }]
        }, {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{
                color: '#2f3948'
            }]
        }, {
            featureType: 'transit.station',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#d59563'
            }]
        }, {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{
                color: '#17263c'
            }]
        }, {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#515c6d'
            }]
        }, {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [{
                color: '#17263c'
            }]
        }], {
            name: 'Night'
        });

    googleMap = new google.maps.Map(document.getElementById('mapGoogle'), {
        zoom: 12,
        center: {
            lat: 37.7881209,
            lng: -122.3954958
        },
        mapTypeControlOptions: {
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain', 'dark_map']
        }
    });

    googleMap.mapTypes.set('dark_map', darkMapType);
    googleMap.setMapTypeId('dark_map');
}


function addMarkerGoogle(lat, lng, title, infoContent) {
    var marker = new google.maps.Marker({
        position: {
            lat: lat,
            lng: lng
        },
        map: googleMap,
        title: title
    });
    marker.addListener('click', function() {
        infowindowGoogle.setContent(infoContent);
        infowindowGoogle.open(googleMap, marker);
    });
    markersGoogle.push(marker);
    console.log("ADDED MARKER, NOW TOTAL: " + markersGoogle.length);
}


function clearAllMarkersGoogle() {
    for (var i = 0; i < markersGoogle.length; i++) {
        markersGoogle[i].setMap(null);
    }
    markersGoogle.length = 0;
}