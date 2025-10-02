import { Hono } from 'hono'
import { cors } from 'hono/cors'
import WeatherController from './controllers/WeatherController.js'

const app = new Hono()

app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type']
}))

const weatherController = new WeatherController()

app.get('/', weatherController.home)
app.get('/predict', weatherController.predict)
app.get('/health', weatherController.health)
app.get('/debug', weatherController.debug)
app.options('*', (c) => c.text('', 204))

export default app
