import { notifyUser, prepareUIForGeocodeCalls, currentProvider, closeNotifier, GOOGLE } from './ui';
import { GeocodeCallCenter } from './geocodeCallCenter';
import { addMarkerGoogle, geocoderGoogle, clearAllMarkersGoogle, initGoogleMap } from './wrapperGoogleMap';
import { addMarkerOther, clearAllMarkersOther, initOtherMap } from './wrapperSecondaryMap';
import { cleanLocation } from './locationCleaner';
var AutoComplete = require('./autocomplete.js');

export { movieResults, locateMovieOnMap, initOtherMap, initGoogleMap };


var geoCallCenter,
    movieResults = [];

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

    prepareUIForGeocodeCalls(movies.length);
    if (currentProvider === GOOGLE)
        geoCallCenter = new GeocodeCallCenter(createGoogleGeocodeRequest, movies.length);
    else
        geoCallCenter = new GeocodeCallCenter(createNominatimGeocodeRequest, movies.length);

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
    request.open('GET',
        'http://nominatim.openstreetmap.org/search/us/california/san francisco/' + (movie.retrying ? cleanLocation(movie.locations) : movie.locations) + '?format=json&limit=1&namedetails=0&extratags=0',
        true);
    request.timeout = 6000;
    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            var json;
            try {
                json = JSON.parse(request.responseText);
            } catch (e) {
                json = [];
            }
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


/**  gets useful information from the movie to compose a marker's info window */
function createMovieInfo(movie) {
    var info = "<h3>" + movie.title + "</h3><p><b>Director:</b> " + movie.director + "<br><b>Year:</b>" + movie.release_year + "<br><b>Location:</b> " + movie.locations + "<br><b>Actor 1:</b> " + movie.actor_1 + "<br><b>Actor 2:</b> " + movie.actor_2;
    if (movie.fun_facts)
        info += "<br><b>Fun fact:</b> " + movie.fun_facts;
    info += "</p>";
    return info;
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
            if (typeof response === "string") {
                try {
                    json = JSON.parse(response);
                } catch (e) {
                    json = null;
                }
            } else //response coming from cache, already parsed
                json = response;

            movieResults.length = 0;

            if (!json || Object.keys(json).length === 0)
                return "";

            movieResults = json;

            var auxMap = new Map();
            return json.filter((movie) => {
                    if (!movie.locations || auxMap.get(movie.title))
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
            notifyUser("Error retrieving suggestions, please try again", true);
        },
        _Select: function(item) {

            console.log("an item's been selected");

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
            setTimeout(function() {
                this.DOMResults.setAttribute("class", "autocomplete");
            }.bind(this), 150);
        }
    }, "#movie-title");
}


initAutocomplete();