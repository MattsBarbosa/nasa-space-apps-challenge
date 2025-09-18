import { getDayOfYear } from './helpers.js'

class CacheManager {
  constructor(kvStorage) {
    this.kv = kvStorage
  }

  // CORRIGIDO: incluir ano na chave para evitar conflitos
  generateKey(lat, lon, date) {
    const dateObj = new Date(date)
    const roundLat = Math.round(lat * 100)
    const roundLon = Math.round(lon * 100)
    const year = dateObj.getFullYear()
    const dayOfYear = getDayOfYear(dateObj)

    // Incluir ano na chave para diferenciar 2025-07-15 de 2027-07-15
    return `weather_${roundLat}_${roundLon}_${year}_day${dayOfYear}_v2`
  }

  async get(key) {
    try {
      if (!this.kv) return null
      const data = await this.kv.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Cache error:', error)
      return null
    }
  }

  async set(key, data, ttl = 86400) {
    try {
      if (!this.kv) return false
      await this.kv.put(key, JSON.stringify(data), { expirationTtl: ttl })
      return true
    } catch (error) {
      console.error('Cache error:', error)
      return false
    }
  }

  // Novo método para limpar cache
  async clearCache(prefix = 'weather_') {
    try {
      if (!this.kv) return false

      const list = await this.kv.list({ prefix })
      const deletePromises = list.keys.map(key => this.kv.delete(key.name))
      await Promise.all(deletePromises)

      return true
    } catch (error) {
      console.error('Cache clear error:', error)
      return false
    }
  }
}

export default CacheManager
