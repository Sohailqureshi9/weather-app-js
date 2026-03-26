# SkyCast - Weather Web App

A polished and responsive weather web application built with HTML, CSS, and vanilla JavaScript.

## Features

- Search weather by city name
- Detect weather using your current location
- Toggle between Celsius and Fahrenheit units
- 5-day forecast cards
- Recent search history with one-click reload
- Sunrise, sunset, and last updated metadata
- Loading state controls to prevent duplicate requests
- Clean error handling for invalid cities and API failures
- Responsive UI for desktop and mobile
- Accessible form controls and semantic structure

## Tech Stack

- HTML5
- CSS3 (custom responsive design + animations)
- JavaScript (ES6+)
- OpenWeather API

## Project Structure

- `index.html` - App layout and semantic structure
- `style.css` - UI styling and responsive design
- `script.js` - Weather logic, API handling, unit conversion, geolocation
- `images/` - Icons used in UI

## Setup

1. Clone this repository.
2. Open `script.js` and set your OpenWeather API key:

```js
const API_KEY = "YOUR_OPENWEATHER_API_KEY";
```

3. Run `index.html` using a live server (recommended) or open it in a browser.

## OpenWeather API Key

- Create a free account at OpenWeather.
- Generate an API key from your dashboard.
- Replace the placeholder key in `script.js`.

## Resume Highlights (You Can Mention)

- Built a weather web app with real-time API integration.
- Implemented geolocation-based weather fetching.
- Added robust async error handling and UI state updates.
- Designed a responsive and accessible interface.

## Future Improvements

- Add 5-day forecast support
- Save recent searches in localStorage
- Add theme variants and weather-based dynamic backgrounds
- Add unit/internationalization preferences persistence

## License

MIT
