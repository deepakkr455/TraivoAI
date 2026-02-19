// services/tripStorage.ts
export interface SavedTrip {
  id: string;
  title: string;
  heroImageText: string;
  htmlContent: string;
  createdAt: string;
  blobUrl?: string; // We'll regenerate this on load
}

const STORAGE_KEY = 'wanderchat_trips';

export const tripStorageService = {
  // Save a new trip
  saveTrip: (trip: Omit<SavedTrip, 'id' | 'createdAt'>): SavedTrip => {
    const trips = tripStorageService.getAllTrips();
    const newTrip: SavedTrip = {
      ...trip,
      id: `trip-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
    };
    trips.unshift(newTrip); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
    return newTrip;
  },

  // Get all trips
  getAllTrips: (): SavedTrip[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading trips:', error);
      return [];
    }
  },

  // Get a single trip by ID
  getTripById: (id: string): SavedTrip | null => {
    const trips = tripStorageService.getAllTrips();
    return trips.find(trip => trip.id === id) || null;
  },

  // Delete a trip
  deleteTrip: (id: string): void => {
    const trips = tripStorageService.getAllTrips();
    const filtered = trips.filter(trip => trip.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  // Generate blob URL from HTML content
  generateBlobUrl: (htmlContent: string): string => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return URL.createObjectURL(blob);
  },
};