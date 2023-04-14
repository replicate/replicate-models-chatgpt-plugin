import express from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
import routes from './routes.js'
import Replicate from 'replicate'
dotenv.config()

const app = express()
app.use(cors({ origin: 'https://chat.openai.com' }))
app.use(express.json())

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

routes(app, replicate)

const main = () => {
  app.listen(5003, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:5003')
  })
}

main()
