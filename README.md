# SF-MOVIES #

a website where you can find film locations and details about every movie ever filmed in San Francisco. Just type in some movie name and see where exactly it was filmed on a map, or type in a letter and choose a movie from the suggestions.

Have a look at the [demo](http://128.199.150.245/sf-movies)
 
 
## Maps
you've got plenty of available maps to choose from. Find Google Maps too boring? Try some new ones!
 
 
## Data
all film locations and information are provided by [SF Open Data](https://data.sfgov.org/Culture-and-Recreation/Film-Locations-in-San-Francisco/yitu-d5am) and the San Francisco Film Commission. Using this website you will be contacting directly San Francisco government's open databases.

## Technologies
used to create sf-movies website:

- [autocomplete.js](https://github.com/autocompletejs/autocomplete.js)
- [leaflet.js](http://leafletjs.com/)
- styles and colors inspired by [Bootswatch](https://bootswatch.com/) particularly the [United](https://bootswatch.com/united/) theme
- map tiles from:
  - [Mapbox](https://www.mapbox.com)
  - [Stamen](https://stamen.com)
  - [ArcGIS](https://www.arcgis.com)
  - [Thunderforest](www.thunderforest.com)
  - [CartoCDN](https://carto.com)
  - [Google Maps](https://developers.google.com/maps)
- geolocation services from:
  - [Google](https://developers.google.com/maps/documentation/javascript/geocoding)
  - OpenStreetMap's [Nomitanim](http://nominatim.openstreetmap.org) open service
- nodejs
- express
- gulp, webpack, babel for builds
- mocha, jsdom for tests

## Build it
clone or download this repo, and in the new folder execute:

```
npm install
npm run test       <-- if want to run tests
npm run build
npm start [port]     <-- optional port, 3000 by default
```

you'll have to install globally Gulp and Webpack for the builds and Mocha for the tests, if you don't have them:

```
npm install -g gulp-cli webpack mocha
```

## Disclaimer
This is just a test project for me to learn new stuff. Use it as you like and don't expect it to work flawlessly.