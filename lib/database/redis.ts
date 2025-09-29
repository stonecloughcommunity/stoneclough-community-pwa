import { env } from '@/lib/config/environment';

export interface RedisInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number; PX?: number }): Promise<string>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  ttl(key: string): Promise<number>;
  flushall(): Promise<string>;
}

class MockRedis implements RedisInterface {
  private store = new Map<string, { value: string; expiry?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: string, options?: { EX?: number; PX?: number }): Promise<string> {
    let expiry: number | undefined;
    
    if (options?.EX) {
      expiry = Date.now() + (options.EX * 1000);
    } else if (options?.PX) {
      expiry = Date.now() + options.PX;
    }
    
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newValue = (current ? parseInt(current, 10) : 0) + 1;
    await this.set(key, newValue.toString());
    return newValue;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    
    item.expiry = Date.now() + (seconds * 1000);
    this.store.set(key, item);
    return 1;
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return 0;
    }
    
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return -2;
    
    if (!item.expiry) return -1;
    
    const remaining = Math.ceil((item.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async flushall(): Promise<string> {
    this.store.clear();
    return 'OK';
  }
}

class RedisClient implements RedisInterface {
  private client: any;
  private connected = false;

  constructor() {
    if (env.nodeEnv === 'test') {
      // Use mock Redis in test environment
      this.client = new MockRedis();
      this.connected = true;
    } else {
      // In production, this would initialize a real Redis client
      // For now, we'll use the mock as a fallback
      this.client = new MockRedis();
      this.connected = true;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.connected) throw new Error('Redis not connected');
    return this.client.get(key);
  }

  async set(key: string, value: string, options?: { EX?: number; PX?: number }): Promise<string> {
    if (!this.connected) throw new Error('Redis not connected');
    return this.client.set(key, value, options);
  }

  async incr(key: string): Promise<number> {
    if (!this.connected) throw new Error('Redis not connected');
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (!this.connected) throw new Error('Redis not connected');
    return this.client.expire(key, seconds);
  }

  async del(key: string): Promise<number> {
    if (!this.connected) throw new Error('Redis not connected');
    return this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    if (!this.connected) throw new Error('Redis not connected');
    return this.client.exists(key);
  }

  async ttl(key: string): Promise<number> {
    if (!this.connected) throw new Error('Redis not connected');
    return this.client.ttl(key);
  }

  async flushall(): Promise<string> {
    if (!this.connected) throw new Error('Redis not connected');
    return this.client.flushall();
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Export singleton instance
export const redis = new RedisClient();

// Export types and classes for testing
export { MockRedis, RedisClient };
