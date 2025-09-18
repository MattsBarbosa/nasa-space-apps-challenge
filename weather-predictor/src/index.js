import { Hono } from 'hono'
import { cors } from 'hono/cors'
import WeatherController from './controllers/WeatherController.js'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type']
}))

const weatherController = new WeatherController()

app.get('/', weatherController.home)
app.get('/predict', weatherController.predict)
app.get('/current', weatherController.current)        // NOVO
app.get('/health', weatherController.health)
app.get('/debug', weatherController.debug)
app.delete('/cache', weatherController.clearCache)
app.options('*', (c) => c.text('', 204))

export default app
