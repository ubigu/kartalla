import { NextFunction, Request, Response, Send } from 'express';
import NodeCache from 'node-cache';

interface MiddlewareResponse extends Response {
  sendResponse?: Send;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isTrustedOrigin(req: Request, allowedOrigin: string): boolean {
  if (SAFE_METHODS.has(req.method)) {
    return true;
  }

  const source = req.headers.origin ?? req.headers.referer;
  try {
    return !!source && new URL(source).origin === allowedOrigin;
  } catch {
    return false;
  }
}

export function iconCacher(cache: NodeCache) {
  return (req: Request, res: MiddlewareResponse, next: NextFunction) => {
    const name = req.params.name;
    const cachedImage = cache.get(name);

    if (cachedImage) {
      res.type('image/svg+xml');
      res.status(200).send(cachedImage);
      return;
    } else {
      res.sendResponse = res.send;

      res.send = (data: Buffer) => {
        if (res.statusCode < 400) {
          cache.set(name, data);
        }

        return res.sendResponse(data);
      };
    }
    next();
  };
}
