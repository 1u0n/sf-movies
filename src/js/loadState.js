var googleMapsAlreadyLoaded = false,
    otherMapsAlreadyLoaded = false;


function getGoogleMapsAlreadyLoaded() {
    return googleMapsAlreadyLoaded;
}

function getOtherMapsAlreadyLoaded() {
    return otherMapsAlreadyLoaded;
}

function setGoogleMapsAlreadyLoaded(loaded) {
    googleMapsAlreadyLoaded = loaded;
}

function setOtherMapsAlreadyLoaded(loaded) {
    otherMapsAlreadyLoaded = loaded;
}



export { setGoogleMapsAlreadyLoaded, getGoogleMapsAlreadyLoaded, setOtherMapsAlreadyLoaded, getOtherMapsAlreadyLoaded };