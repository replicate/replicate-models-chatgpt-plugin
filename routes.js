import boilerplateRoutes from './routes/boilerplate.js'
import replicateRoutes from './routes/replicate.js'

export default (app, replicate) => {
  replicateRoutes(app, replicate)
  boilerplateRoutes(app)
}
