import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

export const asyncHandler =
  (
    handler: (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) =>
    void handler(req, res, next).catch(next);

export function validate(schemas: {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}): RequestHandler {
  return (req, _res, next) => {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.params)
      req.params = schemas.params.parse(req.params) as typeof req.params;
    if (schemas.query) {
      const validatedQuery = schemas.query.parse(req.query) as typeof req.query;
      // No Express 5, `query` é um getter no protótipo da requisição.
      // Uma propriedade própria preserva o resultado validado para os handlers
      // sem tentar escrever diretamente em um getter somente leitura.
      Object.defineProperty(req, "query", {
        value: validatedQuery,
        enumerable: true,
        configurable: true,
        writable: false,
      });
    }
    next();
  };
}

export function pageMeta(total: number, page: number, pageSize: number) {
  return { total, page, pageSize, pages: Math.ceil(total / pageSize) };
}
