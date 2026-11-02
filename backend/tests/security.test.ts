import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.DATABASE_HOST = "127.0.0.1";
  process.env.DATABASE_NAME = "test";
  process.env.DATABASE_USER = "test";
  process.env.DATABASE_PASSWORD = "test";
  process.env.JWT_ACCESS_SECRET = "a".repeat(32);
  process.env.IP_HASH_SECRET = "b".repeat(32);
  process.env.CORS_ORIGINS = "http://localhost:3000";
});

describe("controles de saída e comparação", () => {
  it("remove scripts e manipuladores do HTML de regulamento", async () => {
    const { sanitizeRichHtml } = await import("../src/shared/security.js");
    const result = sanitizeRichHtml(
      '<p onclick="x()">Seguro</p><script>alert(1)</script>',
    );
    expect(result).toBe("<p>Seguro</p>");
  });

  it("mascara matrícula pública", async () => {
    const { maskEmployeeNumber } = await import("../src/shared/security.js");
    expect(maskEmployeeNumber("101010")).toBe("10**10");
  });

  it("compara valores sem aceitar tamanhos diferentes", async () => {
    const { safeEqual } = await import("../src/shared/security.js");
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});
