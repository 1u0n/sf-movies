# AFTERSHIP CHALLEGE #

I've done this project as part of a coding challenge for a backend/api software engineer position.
 
 
## Why did I choose the challenge about the maps

I had never done anything with map apis, so I thought it'd be a good opportunity to solve the challenge and learn something at the same time.

Now looking backwards, it may have not been a wise decision since I ended up doing most of the work in the frontend and I feel like I'm not quite showing relevant stuff for a "backend position".

## Process
it's taken me 6 days to finish the whole thing
- of which 2 I spent learning how to use map apis, what are the current reliable map providers, their services (free vs paying), and making a small poc for some fo them in order to ensure its feasibility.
- another whole day went to the autocomplete.js library, integrating with it, creating 2 new features that I needed (which I added PR for, on its github) and solving a long-time standing bug nobody had completely solved yet.

## Requirements:
- search for movies, with suggestions  =>  implies call to 3rd party movie-data api
- show some details on a map  =>  implies call to 3rd party geolocation api
- both data are open and available as json apis
- in order to locate on a map, we need geolocation coordinates. Raw movie data only has addresses, no coordinates.

## Architecture
options I considered:
1. become a proxy between the user and the data. Users would call my api to get movies and locate their filming locations, I would in order call the different api providers (SFData, geolocation) as needed and reply to the user with their responses.
   - advantage: user doesn't see any 3rd party api call, api tokens are kept private
   - disadvantage: from the user perspective calls take long time. Our server needs to perform more work and consume bandwith => money
2. since the data is open, it could be easily downloaded and incorporated in our own DB, a process could be created in our backend to check regularly for updates, and we would incorporate the rest of the data we need (geolocation coordinates) for every entry. We would become the data providers, through an api.
   - advantage: it's the solution with the fastest user experience: we could provide anything the user needs in just one response.
   - disadvantage: real world data is not usually open and downloadable, I feel that for the challenge I should be showing more real world solutions so I decided not to go with this one.
3. provide the user with a heavier client that implements the logic and capabilities to let her make the calls to the 3rd party apis as she needs.
   - advantage: reasonable user experience.
   - disadvantage: api tokens need to be made public. 

I decided to go with #3. The api token problem is not important as most of them can be secured at the provider: we can restric token use to a specific domain, hence stolen tokens aren't of any use in the open, as users of that "pirate" website would reveal in their Origin / Referer request headers the domain they are in, which is not ours, and the call wouldn't go through.
 
## Technical choices
- Maps:
  - after trying lots of map providers (Google, Bing, Mapbox, Mapzen, DigitalGlobe, OpenStreetMap, Mapquest...) I decided to go with Google because of its api simplicity, speed and free layer services.
  - I happen to be living in China and I'm aware of Google not being available in the whole world, so as I had already studied lots of map providers, I decided to incorporate a solution for this: the website will by default provide the google library and another (leaflet.js) high-level map library, that can integrate with many other providers. I implemented a way so that whichever loads first, the user will start working with it. If/when the second finishes downloading, the user will see a button to swap maps if he wants. If one of the libraries fails to download/is blocked, the user won't notice a thing, and will still be able to work with full capabilities (suggestions, geolocation, maps). I provide several free map providers through leaflet, just to play around.
- Suggestions:
  - I went for autocomplete.js because it's lightweight (10kb), doesn't have dependencies, it's super configurable and open source. There are of course many other libraries but most good ones rely on jquery and I hand't seen a need for jquery for this website. I also paid the price of going with a not-so-known library because I had to struggle to solve a bug nobody had cared to solve.
- Rest of things: Node, Express, Gulp, Mocha... I'm used to them and they do well the work for this case. I actually have more experience in the Java world but it's not the most appropiate for this case.
- Why no frameworks? On the frontend I've only used React, I don't have experience with Angular, Ember, etc.. I use frameworks very selectively or for big applications, when the scale of its use gives me advantages over the problems inherent to adding a layer to the app / loss of flexibility / forcing a way of doing things.
- Why no frontend libraries? I've used jQuery many years, but for simple DOM selection/manipulation, I don't think there's need for it.

## Security
- user calls to 3rd party apis are https if the call carries any token, http otherwise.
- the backend is practicly inexistant and there's no own data to protect.
- in a serious deployment I would use https with a server certificate, and possibly perform call-rate limitation at the load-balancer/reverse proxy level.
- there's hardly any way for us to prevent misuse of the client we provide. But most 3rd api providers will just block an IP if it's making too many calls, so we delegate those security measures on them.

## Tests
being a frontend application, most tests need to be done at the broser level. I've tested all possible user interaction with Firefox, Chrome, IE 11 and Opera. I've also included some unit tests for the few components that implement some logic in the app. I didn't have the time to create automated headless-browser tests.

## Hosting
The app is deployed on a DigitalOcean linux server, and run with PM2.

## Scalability
I think the solution taken is highly scalable since all the work is done at the browsing client. We would just need to pay for higher SLA from our api providers, a CDN for our static files, and some extra bandwith.

## Production readiness
the solution is not production ready: no proper logging, no monitoring capabilities and no error handling in the backend.