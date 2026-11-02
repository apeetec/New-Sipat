import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import sanitizeHtml from "sanitize-html";
import { env } from "../config/env.js";

export const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const hashIp = (ip?: string) =>
  ip ? createHmac("sha256", env.IP_HASH_SECRET).update(ip).digest("hex") : null;
export const randomToken = () => randomBytes(48).toString("base64url");

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform(
        "a",
        { rel: "noopener noreferrer" },
        true,
      ),
    },
    disallowedTagsMode: "discard",
  });
}

export function maskEmployeeNumber(value: string): string {
  if (value.length <= 4) return "*".repeat(value.length);
  return `${value.slice(0, 2)}${"*".repeat(value.length - 4)}${value.slice(-2)}`;
}
