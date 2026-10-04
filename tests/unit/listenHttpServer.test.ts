import { createServer } from 'node:http';
import express from 'express';
import { listenHttpServer, PortInUseError } from '../../src/listenHttpServer';

describe('listenHttpServer', () => {
  it('resolves with the listening server', async () => {
    const server = await listenHttpServer(express(), 0);

    try {
      const address = server.address();
      expect(server.listening).toBe(true);
      expect(address && typeof address !== 'string' ? address.port : 0).toBeGreaterThan(0);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  it('reports a concise actionable error when the requested port is occupied', async () => {
    const occupiedServer = createServer();
    await new Promise<void>((resolve, reject) => {
      occupiedServer.once('error', reject);
      occupiedServer.listen(0, resolve);
    });

    try {
      const address = occupiedServer.address();
      if (!address || typeof address === 'string') throw new Error('Expected a TCP address');

      await expect(listenHttpServer(express(), address.port)).rejects.toEqual(
        new PortInUseError(address.port),
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        occupiedServer.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });
});
