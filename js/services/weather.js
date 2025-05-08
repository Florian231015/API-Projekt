/**
 * Weather & Travel Companion
 * weather.js - Service-Klasse für Wetterdaten
 * 
 * Diese Klasse ist für die Kommunikation mit der OpenWeatherMap API verantwortlich.
 * Sie stellt Methoden zum Abrufen von Wetterdaten bereit.
 */

class WeatherService {
    /**
     * Konstruktor: Initialisiert den WeatherService
     */
    constructor() {
        // API-Schlüssel und Basis-URL
        this.apiKey = '45443d28d481c379268b914c34a01720'; 
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        
        // Metrische Einheiten für Temperatur in Celsius und Windgeschwindigkeit in m/s
        this.units = 'metric';
        
        // Sprache für Wetterbeschreibungen
        this.lang = 'de';
    }
    
    /**
     * Ruft Wetterdaten für einen bestimmten Stadtnamen ab
     * @param {string} city - Der Name der Stadt, für die Wetterdaten abgerufen werden sollen
     * @returns {Promise<Object>} - Ein Promise, das die Wetterdaten enthält
     * @throws {Error} - Wenn beim Abrufen der Daten ein Fehler auftritt
     */
    async getWeatherByCity(city) {
        try {
            const url = `${this.baseUrl}/weather?q=${encodeURIComponent(city)}&units=${this.units}&lang=${this.lang}&appid=${this.apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                // API-Fehlerbehandlung
                const errorData = await response.json();
                throw new Error(this.getErrorMessage(errorData.cod, city));
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            throw new Error(`Fehler beim Abrufen der Wetterdaten: ${error.message}`);
        }
    }
    
    /**
     * Ruft Wetterdaten für bestimmte geografische Koordinaten ab
     * @param {number} lat - Breitengrad
     * @param {number} lon - Längengrad
     * @returns {Promise<Object>} - Ein Promise, das die Wetterdaten enthält
     * @throws {Error} - Wenn beim Abrufen der Daten ein Fehler auftritt
     */
    async getWeatherByCoordinates(lat, lon) {
        try {
            const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&units=${this.units}&lang=${this.lang}&appid=${this.apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                // API-Fehlerbehandlung
                const errorData = await response.json();
                throw new Error(this.getErrorMessage(errorData.cod));
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            throw new Error(`Fehler beim Abrufen der Wetterdaten: ${error.message}`);
        }
    }
    
    /**
     * Generiert benutzerfreundliche Fehlermeldungen basierend auf API-Fehlercodes
     * @param {string|number} errorCode - Der Fehlercode von der OpenWeatherMap API
     * @param {string} [city] - Optional, der Name der gesuchten Stadt
     * @returns {string} - Eine benutzerfreundliche Fehlermeldung
     */
    getErrorMessage(errorCode, city = '') {
        switch (errorCode.toString()) {
            case '401':
                return 'Ungültiger API-Schlüssel. Bitte überprüfen Sie Ihre API-Konfiguration.';
            case '404':
                return city 
                    ? `Die Stadt "${city}" wurde nicht gefunden. Bitte überprüfen Sie die Schreibweise.` 
                    : 'Der Ort wurde nicht gefunden. Bitte versuchen Sie einen anderen Ort.';
            case '429':
                return 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.';
            case '500':
            case '502':
            case '503':
            case '504':
                return 'Serverfehler. Die Wetterdaten sind derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.';
            default:
                return `Fehler beim Abrufen der Wetterdaten (Code: ${errorCode}).`;
        }
    }
}