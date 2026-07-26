# Hoe warm/koud is het vandaag?

A small static site for [hoewarmishetvandaag.nl](https://hoewarmishetvandaag.nl) and [hoekoudishetvandaag.nl](https://hoekoudishetvandaag.nl). It uses browser geolocation and the MET Norway Locationforecast API; there is no backend and no API key.

## Requirements

Node `^20.19.0 || >=22.12.0` and npm.

## Commands

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

The production-ready static files are written to `dist/`.

To preview the cold variant locally, open `http://localhost:5173/?variant=cold`. The query override only works during development. Production determines the variant from the hostname: `hoekoudishetvandaag.nl` (including `www`) is cold; every other hostname is warm.

## Weather data and privacy

The browser requests `https://api.met.no/weatherapi/locationforecast/2.0/compact` directly with rounded latitude and longitude. This lets MET Norway receive the visitor’s IP address and approximate location. Browser geolocation requires HTTPS in production; when it is unavailable or denied, the site shows weather for Amsterdam and labels it clearly.

MET asks low-volume browser clients to make simple GET requests, respect HTTP cache headers, and use no more than four decimal coordinate places. There is no client-side polling or local storage cache. If traffic grows enough to be throttled, the no-backend constraint needs reconsidering.

Weather data is from [MET Norway](https://api.met.no/weatherapi/locationforecast/2.0/documentation), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Read MET Norway’s [privacy policy](https://www.met.no/en/About-us/privacy).

## Deployment

Serve the same contents of `dist/` as static files for both domains over HTTPS. Hosting, DNS, and certificate maintenance are intentionally outside this repository.
