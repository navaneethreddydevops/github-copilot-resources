import { loadConfig } from '../../src/config';

describe('loadConfig', () => {
  it('applies defaults', () => {
    const config = loadConfig({});
    expect(config).toMatchObject({ port: 3000, jwtExpiresIn: 3600, corsOrigin: '*', cleanupCron: '*/5 * * * *' });
  });

  it('parses CORS_ORIGIN lists and rejects a default JWT secret in production', () => {
    expect(loadConfig({ CORS_ORIGIN: 'http://a.test, http://b.test' }).corsOrigin).toEqual(['http://a.test', 'http://b.test']);
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET/);
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
  });
});
