import { Handler, Context, Callback } from 'aws-lambda';
import { createServer, proxy } from 'aws-serverless-express';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import express from 'express';

let cachedServer;

async function bootstrapServer() {
  if (!cachedServer) {
    const expressApp = express() as any;
    const app = await NestFactory.create(AppModule, expressApp);
    await app.init();
    cachedServer = createServer(expressApp);
  }
  return cachedServer;
}

export const handler: Handler = async (
  event,
  context: Context,
  callback: Callback,
) => {
  const server = await bootstrapServer();
  return proxy(server, event, context, 'PROMISE').promise;
};
