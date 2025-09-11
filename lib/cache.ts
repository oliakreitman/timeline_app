// Cache utility for form data with 1-hour expiration
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_PREFIX = 'timeline_app_';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export class FormCache {
  private static getCacheKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }

  private static isExpired(item: CacheItem<any>): boolean {
    return Date.now() > item.expiresAt;
  }

  static set<T>(key: string, data: T): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION
      };
      
      localStorage.setItem(
        this.getCacheKey(key), 
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.warn('Failed to save to cache:', error);
    }
  }

  static get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(this.getCacheKey(key));
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      if (this.isExpired(cacheItem)) {
        this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to read from cache:', error);
      return null;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(this.getCacheKey(key));
    } catch (error) {
      console.warn('Failed to remove from cache:', error);
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  static getCacheInfo(): { key: string; expiresAt: number; isExpired: boolean }[] {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      
      return cacheKeys.map(key => {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        const cacheItem: CacheItem<any> = JSON.parse(cached);
        return {
          key: key.replace(CACHE_PREFIX, ''),
          expiresAt: cacheItem.expiresAt,
          isExpired: this.isExpired(cacheItem)
        };
      }).filter(Boolean) as { key: string; expiresAt: number; isExpired: boolean }[];
    } catch (error) {
      console.warn('Failed to get cache info:', error);
      return [];
    }
  }
}

// Cache keys
export const CACHE_KEYS = {
  CONTACT_INFO: 'contact_info',
  EMPLOYER_INFO: 'employer_info',
  EVENTS: 'events',
  COMPLAINTS: 'complaints',
  CURRENT_STEP: 'current_step'
} as const;
