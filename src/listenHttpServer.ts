import type { Express } from 'express';
import type { Server } from 'node:http';

export class PortInUseError extends Error {
  constructor(port: number) {
    super(`Port ${port} is already in use. Set PORT to use a different port.`);
    this.name = 'PortInUseError';
  }
}

export function listenHttpServer(app: Express, port: number): Promise<Server> {
  const server = app.listen(port);

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      server.off('listening', onListening);
      server.off('error', onError);
    };
    const onListening = () => {
      cleanup();
      resolve(server);
    };
    const onError = (error: NodeJS.ErrnoException) => {
      cleanup();
      reject(error.code === 'EADDRINUSE' ? new PortInUseError(port) : error);
    };

    server.once('listening', onListening);
    server.once('error', onError);
  });
}
