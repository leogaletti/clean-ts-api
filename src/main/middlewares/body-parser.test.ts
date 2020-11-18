import request from 'supertest'
import app from '../config/app'
import { Request, Response } from 'express'

describe('Body Parser Middleware', () => {
  test('Should parse body as json', async () => {
    app.post('/test_body_parser', (request: Request, response: Response) => {
      response.send(request.body)
    })
    await request(app)
      .post('/test_body_parser')
      .send({ name: 'Rodrigo' })
      .expect({ name: 'Rodrigo' })
  })
})
