const API_KEY = "80dd3ca1fce75295f09a4d5469171b06";
const API_BASE = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_API_BASE = "https://api.openweathermap.org/data/2.5/forecast";
const MAX_RECENT = 6;

const weatherForm = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const detectLocationBtn = document.getElementById("detect-location");
const unitToggleBtn = document.getElementById("unit-toggle");

const weatherPanel = document.getElementById("weather-panel");
const weatherIcon = document.getElementById("weather-icon");
const temperatureText = document.getElementById("temperature");
const cityNameText = document.getElementById("city-name");
const descriptionText = document.getElementById("weather-description");
const lastUpdatedText = document.getElementById("last-updated");
const humidityText = document.getElementById("humidity");
const windText = document.getElementById("wind");
const feelsLikeText = document.getElementById("feels-like");
const visibilityText = document.getElementById("visibility");
const sunriseText = document.getElementById("sunrise");
const sunsetText = document.getElementById("sunset");
const forecastGrid = document.getElementById("forecast-grid");
const recentSection = document.getElementById("recent-section");
const recentChips = document.getElementById("recent-chips");
const statusText = document.getElementById("status-text");
const errorText = document.getElementById("error-text");

const iconMap = {
    Clouds: "images/clouds.png",
    Clear: "images/clear.png",
    Rain: "images/rain.png",
    Drizzle: "images/drizzle.png",
    Mist: "images/mist.png",
    Snow: "images/snow.png",
    Thunderstorm: "images/rain.png",
    Haze: "images/mist.png"
};

let isMetric = true;
let latestData = null;
let latestForecast = [];
let recentCities = loadRecentCities();

function setStatus(message) {
    statusText.textContent = message;
}

function setLoading(isLoading) {
    statusText.classList.toggle("loading", isLoading);
    weatherForm.querySelector("button").disabled = isLoading;
    detectLocationBtn.disabled = isLoading;
}

function showError(message) {
    errorText.textContent = message;
    errorText.classList.remove("hidden");
}

function clearError() {
    errorText.textContent = "";
    errorText.classList.add("hidden");
}

function toFahrenheit(celsius) {
    return (celsius * 9) / 5 + 32;
}

function formatTemperature(valueInCelsius) {
    if (isMetric) {
        return `${Math.round(valueInCelsius)}°C`;
    }
    return `${Math.round(toFahrenheit(valueInCelsius))}°F`;
}

function formatWind(speedMetersPerSec) {
    if (isMetric) {
        const kmh = speedMetersPerSec * 3.6;
        return `${Math.round(kmh)} km/h`;
    }
    const mph = speedMetersPerSec * 2.23694;
    return `${Math.round(mph)} mph`;
}

function formatVisibility(visibilityMeters) {
    if (isMetric) {
        return `${(visibilityMeters / 1000).toFixed(1)} km`;
    }
    const miles = visibilityMeters / 1609.34;
    return `${miles.toFixed(1)} mi`;
}

function formatTimeFromUnix(unixSeconds, timezoneShiftSeconds) {
    const date = new Date((unixSeconds + timezoneShiftSeconds) * 1000);
    return date.toUTCString().slice(17, 22);
}

function formatLocalDateTime(unixSeconds, timezoneShiftSeconds) {
    const date = new Date((unixSeconds + timezoneShiftSeconds) * 1000);
    const day = date.toUTCString().slice(0, 3);
    const time = date.toUTCString().slice(17, 22);
    return `${day}, ${time}`;
}

function loadRecentCities() {
    try {
        const raw = localStorage.getItem("sheencast_recent");
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveRecentCities() {
    localStorage.setItem("sheencast_recent", JSON.stringify(recentCities));
}

function addRecentCity(city) {
    const normalized = city.trim();
    if (!normalized) {
        return;
    }
    recentCities = [normalized, ...recentCities.filter((item) => item.toLowerCase() !== normalized.toLowerCase())]
        .slice(0, MAX_RECENT);
    saveRecentCities();
    renderRecentCities();
}

function renderRecentCities() {
    recentChips.innerHTML = "";

    if (!recentCities.length) {
        recentSection.classList.add("hidden");
        return;
    }

    recentSection.classList.remove("hidden");
    recentCities.forEach((city) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.textContent = city;
        chip.addEventListener("click", async () => {
            cityInput.value = city;
            await loadWeatherByCity(city);
        });
        recentChips.appendChild(chip);
    });
}

function pickDailyForecast(list) {
    const grouped = new Map();

    for (const item of list) {
        const date = item.dt_txt.split(" ")[0];
        if (!grouped.has(date)) {
            grouped.set(date, item);
        }

        if (item.dt_txt.includes("12:00:00")) {
            grouped.set(date, item);
        }
    }

    return Array.from(grouped.values()).slice(0, 5);
}

function renderForecast(items) {
    forecastGrid.innerHTML = "";

    items.forEach((item) => {
        const card = document.createElement("article");
        card.className = "forecast-card";
        const day = new Date(item.dt * 1000).toLocaleDateString("en-US", { weekday: "short" });
        const temp = isMetric
            ? `${Math.round(item.main.temp)}°C`
            : `${Math.round(toFahrenheit(item.main.temp))}°F`;

        card.innerHTML = `
            <p class="forecast-day">${day}</p>
            <p class="forecast-temp">${temp}</p>
        `;

        forecastGrid.appendChild(card);
    });
}

function updateWeatherUI(data) {
    const weatherMain = data.weather?.[0]?.main || "Clear";
    const weatherDescription = data.weather?.[0]?.description || "";

    weatherIcon.src = iconMap[weatherMain] || "images/clear.png";
    weatherIcon.alt = `${weatherMain} icon`;

    temperatureText.textContent = formatTemperature(data.main.temp);
    cityNameText.textContent = `${data.name}, ${data.sys.country}`;
    descriptionText.textContent = weatherDescription;

    humidityText.textContent = `${data.main.humidity}%`;
    windText.textContent = formatWind(data.wind.speed);
    feelsLikeText.textContent = formatTemperature(data.main.feels_like);
    visibilityText.textContent = formatVisibility(data.visibility ?? 0);
    sunriseText.textContent = formatTimeFromUnix(data.sys.sunrise, data.timezone);
    sunsetText.textContent = formatTimeFromUnix(data.sys.sunset, data.timezone);
    lastUpdatedText.textContent = `Updated: ${formatLocalDateTime(data.dt, data.timezone)}`;

    if (latestForecast.length) {
        renderForecast(latestForecast);
    }

    weatherPanel.classList.remove("hidden");
}

async function fetchJson(baseUrl, query) {
    if (!API_KEY) {
        throw new Error("Missing API key. Set your OpenWeather API key in script.js.");
    }

    const url = new URL(baseUrl);
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
    url.searchParams.set("appid", API_KEY);
    url.searchParams.set("units", "metric");

    const response = await fetch(url.toString());
    let data = null;

    try {
        data = await response.json();
    } catch {
        throw new Error("Server returned an invalid response.");
    }

    if (!response.ok) {
        const message = data?.message || "Unable to fetch weather data.";
        throw new Error(message);
    }

    return data;
}

async function fetchWeather(query) {
    return fetchJson(API_BASE, query);
}

async function fetchForecast(query) {
    const data = await fetchJson(FORECAST_API_BASE, query);
    return pickDailyForecast(data.list || []);
}

async function loadWeatherByCity(city) {
    const trimmedCity = city.trim();
    if (!trimmedCity) {
        showError("Please enter a city name.");
        return;
    }

    clearError();
    setLoading(true);
    setStatus(`Fetching weather for ${trimmedCity}...`);

    try {
        const [data, forecast] = await Promise.all([
            fetchWeather({ q: trimmedCity }),
            fetchForecast({ q: trimmedCity })
        ]);
        latestData = data;
        latestForecast = forecast;
        updateWeatherUI(data);
        addRecentCity(data.name);
        setStatus(`Showing live weather for ${data.name}.`);
    } catch (error) {
        weatherPanel.classList.add("hidden");
        showError(error.message);
        setStatus("Could not load weather data.");
    } finally {
        setLoading(false);
    }
}

async function loadWeatherByLocation() {
    if (!("geolocation" in navigator)) {
        showError("Geolocation is not supported in this browser.");
        return;
    }

    clearError();
    setLoading(true);
    setStatus("Getting your location...");

    const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
    }).catch(() => null);

    if (!position) {
        showError("Location permission denied or unavailable.");
        setStatus("Unable to detect current location.");
        setLoading(false);
        return;
    }

    const { latitude, longitude } = position.coords;

    try {
        const [data, forecast] = await Promise.all([
            fetchWeather({ lat: latitude, lon: longitude }),
            fetchForecast({ lat: latitude, lon: longitude })
        ]);
        latestData = data;
        latestForecast = forecast;
        updateWeatherUI(data);
        addRecentCity(data.name);
        setStatus(`Showing weather near ${data.name}.`);
    } catch (error) {
        weatherPanel.classList.add("hidden");
        showError(error.message);
        setStatus("Could not load weather data.");
    } finally {
        setLoading(false);
    }
}

function toggleUnits() {
    isMetric = !isMetric;
    unitToggleBtn.textContent = isMetric ? "Show in Fahrenheit" : "Show in Celsius";
    unitToggleBtn.setAttribute("aria-pressed", String(!isMetric));

    if (latestData) {
        updateWeatherUI(latestData);
    }
}

weatherForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadWeatherByCity(cityInput.value);
});

detectLocationBtn.addEventListener("click", async () => {
    await loadWeatherByLocation();
});

unitToggleBtn.addEventListener("click", toggleUnits);

renderRecentCities();
loadWeatherByCity("New York");
