 // Initialize Feather Icons
feather.replace();

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const weatherDisplay = document.getElementById('weatherDisplay');

const recentContainer = document.getElementById('recentContainer');
const recentTags = document.getElementById('recentTags');

// Dashboard Elements
const cityNameEl = document.getElementById('cityName');
const weatherStateEl = document.getElementById('weatherState');
const tempEl = document.getElementById('temp');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const windDirEl = document.getElementById('windDir');
const uvIndexEl = document.getElementById('uvIndex');
const visibilityEl = document.getElementById('visibility');
const pressureEl = document.getElementById('pressure');

let recentSearches = JSON.parse(localStorage.getItem('weather_history')) || [];

// Weather Code Interpretation Mapping (Open-Meteo Standard)
const weatherCodes = {
  0: 'Clear Sky',
  1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Depositing Rime Fog',
  51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
  61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
  71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
  95: 'Thunderstorm'
};

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') handleSearch();
});

// Load persistent searches on boot
renderRecentSearches();

function handleSearch() {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeather(city);
  }
}

// Core Async Fetch Logic
async function fetchWeather(city) {
  showLoading();
  hideError();

  try {
    // Step 1: Resolve Coordinates via Geocoding REST API
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );

    if (!geoRes.ok) throw new Error('Geocoding service unavailable.');
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`Location "${city}" could not be resolved.`);
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    // Step 2: Fetch Multi-Metric Atmospheric Data
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,uv_index,visibility`
    );

    if (!weatherRes.ok) throw new Error('Weather metrics service unreachable.');
    const weatherData = await weatherRes.json();

    // Step 3: Dynamic Render
    renderMetrics(`${name}, ${country}`, weatherData.current);
    updateHistory(name);

  } catch (err) {
    showError(err.message);
  } finally {
    hideLoading();
  }
}

function renderMetrics(locationName, current) {
  cityNameEl.textContent = locationName;
  weatherStateEl.textContent = weatherCodes[current.weather_code] || 'Moderate Conditions';
  tempEl.textContent = Math.round(current.temperature_2m);
  humidityEl.textContent = `${current.relative_humidity_2m}%`;
  windEl.textContent = `${current.wind_speed_10m} km/h`;
  windDirEl.textContent = `${current.wind_direction_10m}°`;
  uvIndexEl.textContent = current.uv_index ?? 'N/A';
  visibilityEl.textContent = `${(current.visibility / 1000).toFixed(1)} km`;
  pressureEl.textContent = `${current.surface_pressure} hPa`;

  weatherDisplay.classList.remove('hidden');
}

// Local Storage & Search History Logic
function updateHistory(city) {
  if (!recentSearches.includes(city)) {
    recentSearches.unshift(city);
    if (recentSearches.length > 4) recentSearches.pop(); // Keep last 4
    localStorage.setItem('weather_history', JSON.stringify(recentSearches));
    renderRecentSearches();
  }
}

function renderRecentSearches() {
  if (recentSearches.length === 0) {
    recentContainer.classList.add('hidden');
    return;
  }

  recentTags.innerHTML = '';
  recentSearches.forEach((city) => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = city;
    tag.addEventListener('click', () => {
      cityInput.value = city;
      fetchWeather(city);
    });
    recentTags.appendChild(tag);
  });

  recentContainer.classList.remove('hidden');
}

// Utility State Handlers
function showLoading() {
  loading.classList.remove('hidden');
  weatherDisplay.classList.add('hidden');
}

function hideLoading() {
  loading.classList.add('hidden');
}

function showError(msg) {
  errorText.textContent = msg;
  errorMessage.classList.remove('hidden');
  weatherDisplay.classList.add('hidden');
}

function hideError() {
  errorMessage.classList.add('hidden');
}