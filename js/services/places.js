/**
 * Weather & Travel Companion
 * places.js - Service-Klasse für Sehenswürdigkeiten
 * 
 * Diese Klasse ist für die Kommunikation mit der Nominatim API (OpenStreetMap)
 * verantwortlich und stellt Methoden zum Abrufen von Sehenswürdigkeiten bereit.
 */

class PlacesService {
    /**
     * Konstruktor: Initialisiert den PlacesService
     */
    constructor() {
        // Basis-URL für die Nominatim API
        this.baseUrl = 'https://nominatim.openstreetmap.org';
        
        // Format der Antwort (JSON)
        this.format = 'json';
        
        // Standard-Anzahl der zurückzugebenden Sehenswürdigkeiten
        this.limit = 6;
        
        // Kategorien für Sehenswürdigkeiten
        this.categories = [
            'tourism=attraction',
            'tourism=museum',
            'tourism=landmark',
            'historic=castle',
            'historic=monument',
            'leisure=park'
        ];
        
        // Sprache für die Ergebnisse
        this.lang = 'de';
        
        // User-Agent für die API-Anfrage (wird von Nominatim empfohlen)
        this.userAgent = 'WeatherTravelCompanion/1.0';
    }
    
    /**
     * Ruft Sehenswürdigkeiten in der Nähe eines bestimmten Standorts ab
     * @param {number} lat - Breitengrad
     * @param {number} lon - Längengrad
     * @param {number} [radius=1500] - Suchradius in Metern
     * @returns {Promise<Array>} - Ein Promise, das eine Liste von Sehenswürdigkeiten enthält
     * @throws {Error} - Wenn beim Abrufen der Daten ein Fehler auftritt
     */
    async getNearbyPlaces(lat, lon, radius = 1500) {
        // Hilfsfunktion, um leere Arrays zu entfernen
function removeEmptyArrays(arrays) {
    return arrays.filter(arr => Array.isArray(arr) && arr.length > 0);
  }
  
  try {
    const promises = this.categories.map(async category => {
      // Splitte "key=value"
      const [key, value] = category.split('=');
  
      // Parameter-Array
      const params = [
        `format=${encodeURIComponent(this.format)}`,
        `q=${encodeURIComponent(value)}`,
        `viewbox=${encodeURIComponent(`${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}`)}`,
        `bounded=1`,
        `limit=${encodeURIComponent(this.limit)}`,
        `accept-language=${encodeURIComponent(this.lang)}`
      ];
  
      // Einzeilige URL
      const url = `${this.baseUrl}/search?${params.join('&')}`;
  
      // Anfrage
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': this.userAgent }
      });
  
      if (!response.ok) {
        console.warn(`Fehler für Kategorie ${category}: HTTP ${response.status}`);
        return [];  // hier kommen leere Arrays ins Ergebnis
      }
  
      const data = await response.json();
      return data || [];
    });
  
    // Alle Promises auflösen
    const resultsArrays = await Promise.all(promises);
    // Leere Arrays rausfiltern
    const nonEmpty = removeEmptyArrays(resultsArrays);
    // Flach zusammenführen
    const allResults = nonEmpty.flat();
  
    return this.processResults(allResults, lat, lon);
  } catch (error) {
    throw new Error(`Fehler beim Abrufen der Sehenswürdigkeiten: ${error.message}`);
  }
  
    }
    
/**
 * Verarbeitet die Rohergebnisse der API und formatiert sie für die Anwendung
 * @param {Array} results - Die Rohergebnisse von der Nominatim API
 * @param {number} userLat - Benutzer-Breitengrad für Distanzberechnung
 * @param {number} userLon - Benutzer-Längengrad für Distanzberechnung
 * @returns {Array} - Eine Liste formatierter Sehenswürdigkeiten
 */
processResults(results, userLat, userLon) {
    // Nur Arrays mit mindestens einem Eintrag verarbeiten
    if (!Array.isArray(results) || results.length === 0) {
        return [];
    }

    // Duplikate entfernen (basierend auf OSM-ID)
    const uniqueResults = this.removeDuplicates(results, 'osm_id');

    // Nur die ersten [limit] Ergebnisse verwenden
    const limitedResults = uniqueResults.slice(0, this.limit);

    return limitedResults.map(item => {
        // Stelle sicher, dass address immer ein Objekt ist
        const addr = item.address || {};
        console.log((item.display_name?.split(',').slice(1).join(', ') || '').trim())
        console.log(item.display_name?.split(',')[-1])
        return {
            properties: {
                name: item.display_name?.split(',')[0] ?? 'Unbenannter Ort',
                address: (item.display_name?.split(',').slice(1).join(', ') || '').trim(),
                tourism: item.type ?? 'Sehenswürdigkeit',
                osm_id: item.osm_id,
                osm_type: item.osm_type
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    parseFloat(item.lon),
                    parseFloat(item.lat)
                ]
            }
        };
    });
}

    
    /**
     * Entfernt Duplikate aus einer Liste basierend auf einem Schlüssel
     * @param {Array} array - Die Liste, aus der Duplikate entfernt werden sollen
     * @param {string} key - Der Schlüssel, anhand dessen Duplikate identifiziert werden
     * @returns {Array} - Eine neue Liste ohne Duplikate
     */
    removeDuplicates(array, key) {
        const seen = new Set();
        return array.filter(item => {
            const k = item[key];
            if (seen.has(k)) {
                return false;
            }
            seen.add(k);
            return true;
        });
    }
}