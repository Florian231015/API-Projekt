/**
 * Weather & Travel Companion
 * country.js - Service-Klasse für Länderinformationen
 * 
 * Diese Klasse ist für die Kommunikation mit der REST Countries API
 * verantwortlich und stellt Methoden zum Abrufen von Länderinformationen bereit.
 */

class CountryService {
    /**
     * Konstruktor: Initialisiert den CountryService
     */
    constructor() {
        // Basis-URL für die REST Countries API
        this.baseUrl = 'https://restcountries.com/v3.1';
        
        // Cache für Länderinformationen
        this.countryCache = new Map();
    }
    
    /**
     * Ruft Informationen zu einem Land anhand seines Ländercodes ab
     * @param {string} countryCode - Der Ländercode nach ISO 3166-1 alpha-2 (z.B. 'DE' für Deutschland)
     * @returns {Promise<Object>} - Ein Promise, das die Länderinformationen enthält
     * @throws {Error} - Wenn beim Abrufen der Daten ein Fehler auftritt
     */
    async getCountryInfo(countryCode) {
        // Wenn der Ländercode nicht gültig ist, früh zurückkehren
        if (!countryCode || typeof countryCode !== 'string') {
            throw new Error('Ungültiger Ländercode');
        }
        
        // Normalisieren des Ländercodes (Großbuchstaben)
        const normalizedCountryCode = countryCode.toUpperCase();
        
        try {
            // Prüfen, ob die Länderinformationen bereits im Cache vorhanden sind
            if (this.countryCache.has(normalizedCountryCode)) {
                return this.countryCache.get(normalizedCountryCode);
            }
            
            // Anfrage an die REST Countries API
            const url = `${this.baseUrl}/alpha/${normalizedCountryCode}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(this.getErrorMessage(response.status, normalizedCountryCode));
            }
            
            const data = await response.json();
            
            // Da die API ein Array zurückgibt (auch bei einem einzelnen Land),
            // nehmen wir das erste Element
            const countryData = data[0];
            
            // Daten im Cache speichern
            this.countryCache.set(normalizedCountryCode, countryData);
            
            return countryData;
        } catch (error) {
            throw new Error(`Fehler beim Abrufen der Länderinformationen: ${error.message}`);
        }
    }
    
    /**
     * Ruft Informationen zu einem Land anhand seines Namens ab
     * @param {string} countryName - Der Name des Landes
     * @returns {Promise<Object>} - Ein Promise, das die Länderinformationen enthält
     * @throws {Error} - Wenn beim Abrufen der Daten ein Fehler auftritt
     */
    async getCountryByName(countryName) {
        try {
            // Anfrage an die REST Countries API
            const url = `${this.baseUrl}/name/${encodeURIComponent(countryName)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(this.getErrorMessage(response.status, countryName));
            }
            
            const data = await response.json();
            
            // Da die API ein Array zurückgibt (auch wenn nur ein Land gefunden wurde),
            // nehmen wir das erste Element
            const countryData = data[0];
            
            // Daten im Cache speichern
            if (countryData && countryData.cca2) {
                this.countryCache.set(countryData.cca2, countryData);
            }
            
            return countryData;
        } catch (error) {
            throw new Error(`Fehler beim Abrufen der Länderinformationen: ${error.message}`);
        }
    }
    
    /**
     * Generiert benutzerfreundliche Fehlermeldungen basierend auf HTTP-Statuscodes
     * @param {number} statusCode - Der HTTP-Statuscode
     * @param {string} countryIdentifier - Der Ländercode oder -name, der verwendet wurde
     * @returns {string} - Eine benutzerfreundliche Fehlermeldung
     */
    getErrorMessage(statusCode, countryIdentifier) {
        switch (statusCode) {
            case 404:
                return `Das Land "${countryIdentifier}" wurde nicht gefunden.`;
            case 429:
                return 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.';
            case 500:
            case 502:
            case 503:
            case 504:
                return 'Serverfehler. Die Länderinformationen sind derzeit nicht verfügbar.';
            default:
                return `Fehler beim Abrufen der Länderinformationen (HTTP-Status: ${statusCode}).`;
        }
    }
    
    /**
     * Löscht alle zwischengespeicherten Länderinformationen
     */
    clearCache() {
        this.countryCache.clear();
    }
}