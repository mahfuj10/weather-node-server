const request = require('supertest');
const app = require('../app'); 

describe('Authentication and Weather Endpoints', () => {
  let token; // Store the JWT token for authenticated requests

  beforeAll(async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'user', password: 'password' });
    token = response.body.token;
  });

  it('should authenticate and get a JWT token', async () => {
    expect(token).toBeDefined();
  });

  it('should return an unauthorized status for invalid JWT', async () => {
    const response = await request(app).get('/weather/NewYork');
    expect(response.status).toBe(401);
  });

  it('should return weather data for an authenticated request', async () => {
    const response = await request(app)
      .get('/weather/dhaka')
      .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('base');
    expect(response.body).toHaveProperty('clouds');
  });

  it('should return an error for an invalid city', async () => {
    const response = await request(app)
      .get('/weather/InvalidCity')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(500);
  });

  it('should return a rate-limit exceeded error', async () => {
    // Send more than 3 requests in a minute

    const response3 = await request(app)
      .get('/weather/NewYork')
      .set('Authorization', `Bearer ${token}`);

    expect(response3.status).toBe(429); // Rate-limit exceeded
  });
});

