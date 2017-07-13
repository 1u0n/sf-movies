//globals
var movieResults = [],
    googleMap,
    markersGoogle = [],
    geocoderGoogle,
    infowindowGoogle,
    otherMap,
    markersOther,

    GOOGLE = 1,
    OTHER = 2,
    currentProvider = undefined,
    goToGoogleMsg = "try good old Google maps",
    goToOtherMsg = "try different maps",
    googleMapsAlreadyLoaded = false,
    otherMapsAlreadyLoaded = false,
    notifiedAboutOtherMaps = false;


//UI-related startup actions and functions
document.querySelector("#movie-title").value = "";

document.querySelector("#notification button").onclick = closeNotifier;

document.querySelector("#swap-maps").onclick = swapMap;

function notifyUser(message) {
    var elem = document.querySelector('#notification');
    elem.querySelector('p').textContent = message;
    elem.className = 'animated fadeInUp';
}

function closeNotifier() {
    var elem = document.querySelector("#notification");
    if (elem.className != 'invisible')
        elem.className = 'animated fadeOutDown';
}

function swapMap() {
    if (currentProvider === GOOGLE) {
        setOtherMapVisible();
    } else {
        setGoogleMapVisible();
    }
}

/**  manages the UI changes and library loading necessary to show google map */
function setGoogleMapVisible() {
    document.querySelector('#mapOther').className = "invisible";
    document.querySelector('#mapGoogle').className = "";
    if (otherMap)
        otherMap.remove();
    if (!googleMap)
        initGoogleMap(true);
    document.querySelector('#swap-maps').textContent = goToOtherMsg;
    currentProvider = GOOGLE;
}


/**  manages the UI changes and library loading necessary to show the secondary map */
function setOtherMapVisible() {
    document.querySelector('#mapGoogle').className = "invisible";
    document.querySelector('#mapOther').className = "";
    initOtherMap(true);
    document.querySelector('#swap-maps').textContent = goToGoogleMsg;
    currentProvider = OTHER;
    if (!notifiedAboutOtherMaps) {
        notifiedAboutOtherMaps = true;
        setTimeout(notifyAboutOtherMaps, 2000);
    }
}

function notifyAboutOtherMaps() {
    var elem = document.querySelector('#notification-othermaps');
    elem.style.display = "inline-block";
    elem.className = 'animated wobble';
    setTimeout(function() {
        elem.className = 'animated fadeOutUp';
        setTimeout(function() {
                elem.style.display = "none";
            },
            1000);
    }, 3000)
}

function setSwapMapVisible() {
    document.querySelector('#swap-maps').className = "animated fadeInLeft right";
}


/**
 *  utility to control the calls the user makes to 3rd party geocode services:
 *    -allows a maximum of 3 parallel calls, preventing making too many requests in short period of time and getting throttled
 *    -knows how many calls finished and updates the UI with that info
 */
var geoCallCenter;

function GeocodeCallCenter(func, numberCalls) {

    //preparing the UI
    document.querySelector("#loading-image").style.display = "none";
    document.querySelector("#movie-title").disabled = true;
    var elem = document.querySelector("#loading-span");
    elem.querySelector("#loading-message").textContent = "Loading 0/" + numberCalls;
    elem.setAttribute("class", "loading animated fadeInLeft");

    //the actual object used to control calls
    return {
        totalCalls: numberCalls,
        finishedCalls: 0,
        ongoingCalls: 0,
        queuedCalls: [],
        func: func,
        happenedError: null,
        notifyCallFinished: function(errorStr) {
            if (errorStr)
                this.happenedError = errorStr;
            document.querySelector("#loading-message").textContent = "Loading " + ++this.finishedCalls + "/" + this.totalCalls;
            if (--this.ongoingCalls < 3 && this.queuedCalls.length !== 0) {
                this.ongoingCalls++;
                (this.queuedCalls.shift())();
            }
            if (this.finishedCalls === this.totalCalls)
                this.allCallsFinished();
        },
        setFunc: function(f) {
            this.func = f;
        },
        call: function() {
            if (this.ongoingCalls > 2) {
                this.queuedCalls.push(this.func.bind(null, arguments[0]));
            } else {
                this.ongoingCalls++;
                this.func.apply(null, arguments);
            }
        },
        allCallsFinished: function() {
            if (this.happenedError)
                notifyUser(this.happenedError);
            document.querySelector("#movie-title").disabled = false;
            setTimeout(function() {
                document.querySelector("#loading-span").setAttribute("class", "loading animated fadeOutUp");
            }, 1000);
        }
    }
}


/**  sets up the suggestions library */
function initAutocomplete() {
    AutoComplete({
        EmptyMessage: "No movies found",
        MinChars: 1,
        Delay: 500,
        RequestTimeout: 5000,
        Url: "http://data.sfgov.org/resource/wwmu-gmzc.json",
        QueryArg: "$where",
        _Pre: function() {
            if (this.Input.value.length == 0)
                return "";
            var elem = document.querySelector("#loading-image");
            elem.style.display = "inline-block";
            elem.setAttribute("class", "loading animated fadeInLeft");
            return 'starts_with(UPPER(title), "' + this.Input.value.toUpperCase() + '")';
        },
        _Post: function(response) {
            document.querySelector('img.loading').setAttribute("class", "loading animated fadeOutUp");
            var json;
            if (typeof response === "string")
                json = JSON.parse(response);
            else //response coming from cache, already parsed
                json = response;

            movieResults.length = 0;

            if (Object.keys(json).length === 0)
                return "";

            movieResults = json;

            var auxMap = new Map();
            return json.filter((movie) => {
                    if (auxMap.get(movie.title))
                        return false;
                    auxMap.set(movie.title, true);
                    return true;
                })
                .map((movie) => {
                    return {
                        "Value": movie.title,
                        "Label": '(' + movie.release_year + ') ' + movie.title
                    }
                });
        },
        _RequestError: function() {
            document.querySelector('img.loading').setAttribute("class", "loading animated fadeOutUp");
            notifyUser("Error retrieving suggestions, please try again");
        },
        _Select: function(item) {

            console.log("_SELECT");

            if (currentProvider === GOOGLE)
                clearAllMarkersGoogle();
            else
                clearAllMarkersOther();
            closeNotifier();
            if (item.hasAttribute("data-autocomplete-value"))
                this.Input.value = item.getAttribute("data-autocomplete-value");
            else
                this.Input.value = item.innerHTML;
            this.Input.setAttribute("data-autocomplete-old-value", this.Input.value);
            locateMovieOnMap(this.Input.value);
        },
        _Focus: function() {
            this.Input.select();
            if (this._MinChars() <= this.Input.value.length)
                this.DOMResults.setAttribute("class", "autocomplete open");
        },
        _Position: function() {
            this.DOMResults.setAttribute("class", "autocomplete");
            this.DOMResults.setAttribute("style", "top:" + (this.Input.offsetTop + this.Input.offsetHeight) + "px;left:" + this.Input.offsetLeft + "px;min-width:" + (parseInt(this.Input.clientWidth) + 15) + "px;");
        },
        _Cache: function(value) {
            value = value.toLowerCase();
            var originalValue = value;
            var response = this.$Cache[value];
            if (response === undefined && value.length > 1) {
                while (value.length > 1) {
                    value = value.substring(0, value.length - 1);
                    response = this.$Cache[value];
                    if (response) {
                        response = JSON.parse(response);
                        response = response.filter((movie) => {
                            return movie.title.toLowerCase().startsWith(originalValue)
                        });
                        break;
                    }
                }
            }
            //if nothing found, the pluging needs an 'undefined' response
            if (response && !response.length)
                return undefined;
            return response;
        },
        _Blur: function(event) {
            event.preventDefault();
            var that = this;
            setTimeout(function() {
                that.DOMResults.setAttribute("class", "autocomplete");
            }, 150);
        }
    }, "#movie-title");
}


/**  for a given movie, create a marker on the map for each of its locations */
function locateMovieOnMap(title) {
    //check if the movie has locations
    var movies = movieResults.filter(movie => (movie.title === title && movie.locations));
    if (movies.length == 0)
        return notifyUser("No locations for this movie");

    //avoid duplicated locations
    var auxMap = new Map();
    movies = movies.filter((movie) => {
        if (auxMap.get(movie.locations))
            return false;
        auxMap.set(movie.locations, true);
        return true;
    })

    if (currentProvider === GOOGLE)
        geoCallCenter = GeocodeCallCenter(createGoogleGeocodeRequest, movies.length);
    else
        geoCallCenter = GeocodeCallCenter(createNominatimGeocodeRequest, movies.length);
    movies.forEach((movie) => {
        geoCallCenter.call(movie);
    })
}

/**
 * uses google api client to call google geocoding service to place a marker on the map.
 * Will retry with a cleaner location if nothing found on the 1st attempt.
 */
function createGoogleGeocodeRequest(movie) {
    geocoderGoogle.geocode({
            address: movie.retrying ? cleanLocation(movie.locations) : movie.locations,
            componentRestrictions: {
                country: 'US',
                locality: 'san francisco'
            }
        },
        function(results, status) {
            if (status === 'OK') {
                console.log("OK: " + results[0].geometry.location.lat() + " " + results[0].geometry.location.lng());
                geoCallCenter.notifyCallFinished();
                addMarkerGoogle(results[0].geometry.location.lat(), results[0].geometry.location.lng(), movie.locations, createMovieInfo(movie));
            } else if ((status === "ZERO_RESULTS" || status === "UNKNOWN_ERROR") && !movie.retrying) {
                console.log("ZERO RESULTS");
                movie.retrying = true;
                createGoogleGeocodeRequest(movie);
            } else { //call failed twice or Google doesn't want to answer us: we give up on this location
                console.log("UNCLEAR ERROR: " + status);
                geoCallCenter.notifyCallFinished("Some addresses are not clear and couldn't be located");
            }
        }
    )
}

/**
 * uses openstreetmap's nominatim geocoding open service to place a marker on the map
 * Will retry with a cleaner location if nothing found on the 1st attempt.
 */
function createNominatimGeocodeRequest(movie) {
    var request = new XMLHttpRequest();
    request.timeout = 6000;
    request.open('GET',
        'http://nominatim.openstreetmap.org/search/us/california/san francisco/' + (movie.retrying ? cleanLocation(movie.locations) : movie.locations) + '?format=json&limit=1&namedetails=0&extratags=0',
        true);
    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            var json = JSON.parse(request.responseText);
            if (json.length) {
                geoCallCenter.notifyCallFinished();
                return addMarkerOther(json[0].lat, json[0].lon, movie.locations, createMovieInfo(movie));
            }
        }
        //if error or empty response: retry with cleaner location
        if (!movie.retrying) {
            movie.retrying = true;
            createNominatimGeocodeRequest(movie);
        } else { //call failed twice, we give up on it
            geoCallCenter.notifyCallFinished("Some addresses are not clear and couldn't be located");
        }
    };
    //on timeout we just retry without cleaning location
    request.ontimeout = function() {
        console.log("TIMED OUT");
        createNominatimGeocodeRequest(movie);
    };
    request.onerror = function() {
        console.log("HTTP ERROR");
        if (!movie.retrying) {
            movie.retrying = true;
            createNominatimGeocodeRequest(movie);
        } else {
            geoCallCenter.notifyCallFinished("Couldn't locate some addresses due to network error");
        }
    };
    request.send();
}

/**
 * Makes the location more readable, improving the geocode service's success rate
 * (original addresses from the DB are really messy)
 */
function cleanLocation(location) {

    console.log(location);

    location = location.toLowerCase();

    //San Francisco Chronicle (901 Mission Street at 15th Street)
    if (location.indexOf('(') != -1 && location.indexOf(')') != -1)
        location = location.substring(location.indexOf('(') + 1, location.indexOf(')'));

    //Lands End Trail at Eagles Point/ Lincoln Golf Course
    //20th St and Illinois/Faxon St. and Kenwodd/Glenbrook at Mt. Springs
    //Pier 43 1/2
    //Sam Jordan's Bar and Grill, 4004 3rd st
    //Montgomery & Market Streets
    var aux;
    if (location.indexOf('/') != -1)
        aux = location.split('/');
    else if (location.indexOf(',') != -1)
        aux = location.split(',');
    else if (location.indexOf('&') != -1)
        aux = location.split('&');
    else if (location.indexOf(' and ') != -1)
        aux = location.split(' and ');
    if (aux) {
        var found = false;
        for (var i = 0; i < aux.length; i++) {
            if (aux[i].indexOf(' st') > 1 || aux[i].indexOf(' av') > 1 || aux[i].indexOf(' dr') > 1 || aux[i].indexOf(' sq') > 1 ||
                aux[i].indexOf(' at ') != -1 || aux[i].indexOf(' @ ') != -1 || aux[i].indexOf('from ') != -1) {
                found = true;
                location = aux[i];
                break;
            }
            if (!found)
                location = aux[0];
        }
    }

    //901 main street at 15th street
    if (location.indexOf(' at ') != -1)
        location = location.substring(location.indexOf(' at ') + 4);

    //Romolo Place @ Fresno St.
    if (location.indexOf(' @ ') != -1)
        location = location.substring(location.indexOf(' @ ') + 3);

    //Way Faire Inn on Leidesdorff
    if (location.indexOf(' on ') != -1)
        location = location.substring(location.indexOf(' on ') + 4);

    //Pier 45 - Jeremiah O'Brien Liberty Ship
    //Pier 50- end of the pier
    if (location.indexOf('- ') != -1)
        location = location.substring(0, location.indexOf('- '));

    //1158-70 Montgomery Street
    if (location.indexOf('-') != -1) {
        var aux = location.split('-');
        location = aux[0] + aux[1].substring(aux[1].indexOf(' '));
    }

    //Chestnut St. from Larkin to Columbus
    //Leavenworth from Filbert & Francisco St
    if (location.indexOf('from ') != -1)
        location = location.substring(0, location.indexOf('from '));

    //Laguna Honda Hospital; 375 Laguna
    if (location.indexOf('; ') != -1)
        location = location.substring(location.indexOf('; ') + 2);

    //Corner of Van Ness & Mission street
    if (location.indexOf('corner of ') != -1)
        location = location.substring(location.indexOf('corner of ') + 10);

    if (location.indexOf('intersection of ') != -1)
        location = location.substring(location.indexOf('intersection of ') + 16);

    if (location.indexOf('intersection between ') != -1)
        location = location.substring(location.indexOf('intersection between ') + 21);

    //Market between Stuart and Van Ness
    if (location.indexOf('between ') != -1)
        location = location.substring(0, location.indexOf('between '));

    //Park 77 (now called The Lister Bar), 77 Cambon Dr.
    if (location.indexOf('now called ') != -1)
        location = location.substring(location.indexOf('now called ') + 11);

    if (location.indexOf('streets') != -1)
        location = location.substring(0, location.indexOf('streets') + 6);

    console.log(location);

    return location;
}


/**  gets useful information from the movie to compose a marker's info window */
function createMovieInfo(movie) {
    var info = "<h3>" + movie.title + "</h3><p><b>Director:</b> " + movie.director + "<br><b>Year:</b>" + movie.release_year + "<br><b>Location:</b> " + movie.locations + "<br><b>Actor 1:</b> " + movie.actor_1 + "<br><b>Actor 2:</b> " + movie.actor_2;
    if (movie.fun_facts)
        info += "<br><b>Fun fact:</b> " + movie.fun_facts;
    info += "</p>";
    return info;
}



//GOOGLE MAP

/**  creates the objects necessary to show google maps, and adds a new styled layer */
function initGoogleMap(force) {

    if (!force) {
        googleMapsAlreadyLoaded = true;
        if (!otherMapsAlreadyLoaded)
            return setGoogleMapVisible();
        else
            return setSwapMapVisible();
    }

    if (typeof google === 'undefined')
        return notifyUser("Google maps failed to load");

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


//OTHER MAP

/**  creates layers from different map providers and adds them to the map */
function initOtherMap(force) {

    if (!force) {
        otherMapsAlreadyLoaded = true;
        if (!googleMapsAlreadyLoaded)
            return setOtherMapVisible();
        else
            return setSwapMapVisible();
    }

    if (typeof L === 'undefined')
        return notifyUser("failed to load other maps");

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
    //markersOther.remove();
    markersOther.clearLayers();
}