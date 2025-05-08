/**
 * Weather & Travel Companion
 * script.js - Hauptskript für die Anwendung
 * 
 * Dieses Skript initialisiert die App und koordiniert die Interaktion
 * zwischen den verschiedenen Service-Klassen (Weather, Places, Country)
 * und der Benutzeroberfläche.
 */

class App {
    constructor() {
        this.weatherService = new WeatherService();
        this.placesService = new PlacesService();
        this.countryService = new CountryService();
        
        this.searchInput = document.getElementById('searchInput');
        this.searchButton = document.getElementById('searchButton');
        this.getCurrentLocationButton = document.getElementById('getCurrentLocation');
        this.loadingIndicator = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.resultsContainer = document.getElementById('results');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.searchButton.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        this.getCurrentLocationButton.addEventListener('click', () => this.getUserLocation());
    }
    
    handleSearch() {
        const searchTerm = this.searchInput.value.trim();
        if (searchTerm) {
            this.searchByCity(searchTerm);
        }
    }
    
    async searchByCity(city) {
        this.showLoading();
        try {
            const weatherData = await this.weatherService.getWeatherByCity(city);
            await this.loadAllData(weatherData.coord.lat, weatherData.coord.lon, weatherData.sys.country);
        } catch (error) {
            this.showError(`Fehler beim Suchen nach "${city}": ${error.message}`);
        }
    }
    
    getUserLocation() {
        this.showLoading();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        const weatherData = await this.weatherService.getWeatherByCoordinates(lat, lon);
                        await this.loadAllData(lat, lon, weatherData.sys.country);
                    } catch (error) {
                        this.showError(`Fehler beim Laden der Daten für Ihre Position: ${error.message}`);
                    }
                },
                (error) => {
                    let errorMsg = this.getGeolocationErrorMessage(error);
                    this.showError(errorMsg);
                }
            );
        } else {
            this.showError("Geolokalisierung wird von Ihrem Browser nicht unterstützt.");
        }
    }
    
    async loadAllData(lat, lon, countryCode) {
        try {
            const [weatherData, placesData, countryData] = await Promise.all([
                this.weatherService.getWeatherByCoordinates(lat, lon),
                this.placesService.getNearbyPlaces(lat, lon),
                this.countryService.getCountryInfo(countryCode)
            ]);
            this.updateWeatherUI(weatherData);
            this.updatePlacesUI(placesData, lat, lon);
            this.updateCountryUI(countryData);
            this.hideLoading();
            this.showResults();
            this.searchInput.value = weatherData.name;
        } catch (error) {
            this.showError(`Fehler beim Laden der Daten: ${error.message}`);
        }
    }
    
    updateWeatherUI(data) {
        document.getElementById('weatherLocation').textContent = `${data.name}, ${data.sys.country}`;
        document.getElementById('weatherTemp').textContent = `${Math.round(data.main.temp)}°C`;
        document.getElementById('weatherDescription').textContent = data.weather[0].description;
        document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
        document.getElementById('windSpeed').textContent = `${data.wind.speed} m/s`;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    }
    
    updatePlacesUI(places, userLat, userLon) {
        const placesContainer = document.getElementById('placesContainer');
        // 1) .no-places-Element holen oder neu anlegen
        let noPlacesMessage = placesContainer.querySelector('.no-places');
        if (!noPlacesMessage) {
            noPlacesMessage = document.createElement('div');
            noPlacesMessage.className = 'col-12 text-center no-places d-none';
            noPlacesMessage.innerHTML = '<p>Keine Sehenswürdigkeiten in der Nähe gefunden.</p>';
        }
    
        // 2) Container leeren und dann das no-places-Element wieder anfügen
        placesContainer.innerHTML = '';
        placesContainer.appendChild(noPlacesMessage);
    
        // 3) Wenn keine Orte gefunden wurden, Nachricht einblenden und Abbruch
        if (!places || places.length === 0) {
            noPlacesMessage.classList.remove('d-none');
            return;
        }
        // andernfalls Nachricht ausblenden
        noPlacesMessage.classList.add('d-none');
    
        // 4) Für jeden Platz eine Karte erzeugen
        places.forEach(place => {
            const distance = this.calculateDistance(
                userLat, userLon,
                place.geometry.coordinates[1],
                place.geometry.coordinates[0]
            );
            const placeholderImg = this.getPlaceholderImageByCategory(place.properties.tourism);
    
            const placeCard = document.createElement('div');
            placeCard.className = 'col-md-6 col-lg-4 mb-3';
            placeCard.innerHTML = `
                <div class="card place-card h-100">
                    <div class="place-img-container">
                        <img src="${placeholderImg}" alt="${place.properties.name}">
                    </div>
                    <span class="place-category">
                      ${this.capitalizeFirstLetter(place.properties.tourism)}
                    </span>
                    <div class="card-body">
                        <h5 class="card-title">${place.properties.name}</h5>
                        <p class="place-distance">
                          <i class="fas fa-map-marker-alt me-1"></i>
                          ${distance} km entfernt
                        </p>
                        <p class="card-text">
                          ${(place.properties.address)}
                        </p>
                    </div>
                    <div class="card-footer bg-transparent">
                        <a href="
                          https://www.openstreetmap.org/?mlat=${place.geometry.coordinates[1]}
                          &mlon=${place.geometry.coordinates[0]}&zoom=16
                        " class="btn btn-outline-primary btn-sm" target="_blank">
                            <i class="fas fa-map me-1"></i>Auf Karte anzeigen
                        </a>
                    </div>
                </div>
            `;
            placesContainer.appendChild(placeCard);
        });
    }
    
    
    updateCountryUI(data) {
        if (!data) return;
        document.getElementById('countryName').textContent = data.name.common;
        document.getElementById('countryNativeName').textContent = this.getNativeName(data.name.nativeName);
        document.getElementById('countryFlag').src = data.flags.png;
        document.getElementById('countryFlag').alt = `Flagge von ${data.name.common}`;
        document.getElementById('capital').textContent = data.capital && data.capital.length > 0 ? data.capital[0] : 'Nicht verfügbar';
        document.getElementById('population').textContent = this.formatNumber(data.population);
        document.getElementById('languages').textContent = this.formatLanguages(data.languages);
        document.getElementById('currency').textContent = this.formatCurrencies(data.currencies);
        document.getElementById('region').textContent = `${data.region}${data.subregion ? ', ' + data.subregion : ''}`;
        document.getElementById('callingCode').textContent = data.idd && data.idd.root ? `${data.idd.root}${data.idd.suffixes && data.idd.suffixes[0] ? data.idd.suffixes[0] : ''}` : 'Nicht verfügbar';
    }
    
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return distance.toFixed(1);
    }
    
    deg2rad(deg) {
        return deg * (Math.PI/180);
    }
    
    formatAddress(address) {
        const addressParts = [];
        if (address.road) addressParts.push(address.road + (address.house_number ? ' ' + address.house_number : ''));
        let cityPart = (address.postcode ? address.postcode + ' ' : '') + (address.city || address.town || address.village || '');
        if (cityPart.trim()) addressParts.push(cityPart);
        return addressParts.length ? addressParts.join(', ') : 'Adresse nicht verfügbar';
    }
    
    getPlaceholderImageByCategory(category) {
        return `https://placehold.co/600x400/3498db/ffffff?text=${category}`;
    }
    
    formatNumber(num) {
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    }
    
    getNativeName(nativeName) {
        const firstLangCode = Object.keys(nativeName || {})[0];
        return firstLangCode && nativeName[firstLangCode] && nativeName[firstLangCode].common ? nativeName[firstLangCode].common : '';
    }
    
    formatLanguages(languages) {
        return languages ? Object.values(languages).join(', ') : 'Nicht verfügbar';
    }
    
    formatCurrencies(currencies) {
        return currencies ? Object.entries(currencies).map(([code, info]) => `${info.name} (${info.symbol || code})`).join(', ') : 'Nicht verfügbar';
    }
    
    capitalizeFirstLetter(string) {
        return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
    }
    
    getGeolocationErrorMessage(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED: return "Standortzugriff wurde verweigert. Bitte erlauben Sie den Zugriff auf Ihren Standort.";
            case error.POSITION_UNAVAILABLE: return "Standortinformationen sind nicht verfügbar.";
            case error.TIMEOUT: return "Zeitüberschreitung beim Abrufen des Standorts.";
            default: return "Unbekannter Fehler beim ermitteln des Standorts.";
        }
    }
    
    showLoading() {
        this.loadingIndicator.classList.remove('d-none');
        this.resultsContainer.classList.add('d-none');
        this.errorMessage.classList.add('d-none');
    }
    
    hideLoading() {
        this.loadingIndicator.classList.add('d-none');
    }
    
    showResults() {
        this.resultsContainer.classList.remove('d-none');
    }
    
    showError(message) {
        this.hideLoading();
        this.resultsContainer.classList.add('d-none');
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('d-none');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});