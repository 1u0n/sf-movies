import { initGoogleMap, googleMap } from './wrapperGoogleMap';
import { initOtherMap, otherMap } from './wrapperSecondaryMap';

export { GOOGLE, OTHER, notifyUser, closeNotifier, setGoogleMapVisible, setOtherMapVisible, setSwapMapVisible, prepareUIForGeocodeCalls, prepareUIFinishedGeocodeCalls, updateUIFinishedCalls, currentProvider };


var GOOGLE = 1,
    OTHER = 2,
    currentProvider = undefined,
    goToGoogleMsg = "try good old Google maps",
    goToOtherMsg = "try different maps",
    notifiedAboutOtherMaps = false;

//UI-related startup actions and functions
document.querySelector("#movie-title").value = "";

document.querySelector("#notification button").onclick = closeNotifier;

document.querySelector("#swap-maps").onclick = swapMap;

function notifyUser(message, important) {
    var elem = document.querySelector('#notification');
    if (important)
        elem.querySelector('h3').style.display = "block";
    else
        elem.querySelector('h3').style.display = "none";
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

function prepareUIForGeocodeCalls(numberCalls) {
    document.querySelector("#loading-image").style.display = "none";
    document.querySelector("#movie-title").disabled = true;
    var elem = document.querySelector("#loading-span");
    elem.querySelector("#loading-message").textContent = "Loading 0/" + numberCalls;
    elem.setAttribute("class", "loading animated fadeInLeft");
}

function prepareUIFinishedGeocodeCalls() {
    document.querySelector("#movie-title").disabled = false;
    setTimeout(function() {
        document.querySelector("#loading-span").setAttribute("class", "loading animated fadeOutUp");
    }, 1000);
}

function updateUIFinishedCalls(finished, total) {
    document.querySelector("#loading-message").textContent = "Loading " + finished + "/" + total;
}