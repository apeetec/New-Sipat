export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (resource = "Recurso") =>
  new AppError(404, "NOT_FOUND", `${resource} não encontrado.`);
export const forbidden = (
  message = "Você não possui permissão para esta operação.",
) => new AppError(403, "FORBIDDEN", message);
export const conflict = (message: string) =>
  new AppError(409, "CONFLICT", message);
