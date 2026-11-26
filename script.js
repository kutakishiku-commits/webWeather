const $ = (id) => document.getElementById(id);

const weatherCodes = {
  0: ["Ясно", "☀"], 1: ["Преимущественно ясно", "🌤"], 2: ["Переменная облачность", "⛅"],
  3: ["Пасмурно", "☁"], 45: ["Туман", "🌫"], 48: ["Изморозь", "🌫"],
  51: ["Лёгкая морось", "🌦"], 53: ["Морось", "🌦"], 55: ["Сильная морось", "🌧"],
  61: ["Небольшой дождь", "🌦"], 63: ["Дождь", "🌧"], 65: ["Сильный дождь", "🌧"],
  71: ["Небольшой снег", "🌨"], 73: ["Снег", "🌨"], 75: ["Сильный снег", "❄"],
  80: ["Ливень", "🌧"], 81: ["Сильный ливень", "🌧"], 82: ["Очень сильный ливень", "⛈"],
  95: ["Гроза", "⛈"], 96: ["Гроза с градом", "⛈"], 99: ["Сильная гроза", "⛈"]
};

const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const fullDays = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

function showStatus(message, error = false) {
  $("status").textContent = message;
  $("status").style.color = error ? "#ffb5b5" : "#aeb7c7";
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

async function loadWeather(latitude, longitude, cityName) {
  showStatus("Получаем актуальный прогноз...");
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude, longitude,
      current: "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,precipitation_probability_max",
      timezone: "auto",
      forecast_days: "4"
    });
    const response = await fetch(url);
    if (!response.ok) throw new Error("Не удалось получить данные о погоде");
    const data = await response.json();
    const current = data.current;
    const [description, icon] = weatherCodes[current.weather_code] || ["Погода неизвестна", "☁"];
    const now = new Date();

    $("weekday").textContent = fullDays[now.getDay()];
    $("date").textContent = formatDate(now);
    $("location").textContent = cityName;
    $("currentIcon").textContent = icon;
    $("temperature").textContent = Math.round(current.temperature_2m);
    $("condition").textContent = description;
    $("precipitation").textContent = `${Math.round(current.precipitation)} мм`;
    $("humidity").textContent = `${current.relative_humidity_2m}%`;
    $("wind").textContent = `${Math.round(current.wind_speed_10m)} км/ч`;

    const forecast = $("forecast");
    forecast.innerHTML = "";
    data.daily.time.forEach((dateString, index) => {
      const date = new Date(`${dateString}T12:00:00`);
      const code = data.daily.weather_code[index];
      const [, dayIcon] = weatherCodes[code] || ["", "☁"];
      const day = document.createElement("div");
      day.className = `forecast-day${index === 0 ? " active" : ""}`;
      const label = index === 0 ? "Сегодня" : dayNames[date.getDay()];
      day.innerHTML = `<span class="small-icon">${dayIcon}</span><span>${label}</span><b>${Math.round(data.daily.temperature_2m_max[index])}°C</b>`;
      forecast.appendChild(day);
    });
  } catch (error) {
    showStatus(error.message || "Ошибка загрузки погоды", true);
  }
}

async function searchCity(city) {
  if (!city.trim()) return;
  showStatus("Ищем город...");
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.search = new URLSearchParams({ name: city.trim(), count: "1", language: "ru", format: "json" });
    const response = await fetch(url);
    if (!response.ok) throw new Error("Ошибка поиска города");
    const result = await response.json();
    if (!result.results?.length) throw new Error("Город не найден. Попробуйте другое название.");
    const place = result.results[0];
    const location = [place.name, place.country_code].filter(Boolean).join(", ");
    await loadWeather(place.latitude, place.longitude, location);
  } catch (error) {
    showStatus(error.message, true);
  }
}

$("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  searchCity($("cityInput").value);
});

loadWeather(42.8746, 74.5698, "Bishkek, KG");
