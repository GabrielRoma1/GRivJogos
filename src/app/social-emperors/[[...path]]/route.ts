import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = "http://127.0.0.1:5050";
const PREFIX = "/social-emperors";

function rewriteLocation(location: string): string {
  if (location.startsWith(UPSTREAM)) {
    return location.replace(UPSTREAM, PREFIX);
  }
  if (location.startsWith("/")) {
    return `${PREFIX}${location}`;
  }
  return location;
}

function rewriteBodyText(text: string): string {
  let result = text.replaceAll(UPSTREAM, PREFIX);

  if (/<html/i.test(result)) {
    if (!/<base\s/i.test(result)) {
      result = result.replace(
        /<head([^>]*)>/i,
        `<head$1><base href="${PREFIX}/">`
      );
    }

    result = result.replace(
      /(href|src|action)=(["'])\/(?!social-emperors)/gi,
      `$1=$2${PREFIX}/`
    );
  }

  return result;
}

function shouldRewriteBody(contentType: string | null): boolean {
  if (!contentType) return false;
  const ct = contentType.toLowerCase();
  return (
    ct.includes("text/html") ||
    ct.includes("text/xml") ||
    ct.includes("application/xml") ||
    ct.includes("application/javascript") ||
    ct.includes("text/javascript")
  );
}

async function proxy(request: NextRequest, pathSegments: string[] | undefined) {
  const path = pathSegments?.join("/") ?? "";
  const target = `${UPSTREAM}/${path}${request.nextUrl.search}`;

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const upstreamContentType = upstream.headers.get("content-type");
  const responseHeaders = new Headers();

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "location") {
      responseHeaders.set("location", rewriteLocation(value));
    } else if (lower !== "transfer-encoding" && lower !== "content-encoding") {
      responseHeaders.set(key, value);
    }
  });

  responseHeaders.set("Access-Control-Allow-Origin", "*");

  let body: ArrayBuffer | string = await upstream.arrayBuffer();

  if (shouldRewriteBody(upstreamContentType)) {
    const text = new TextDecoder().decode(body);
    body = rewriteBodyText(text);
    responseHeaders.set("content-length", String(Buffer.byteLength(body, "utf8")));
  }

  return new NextResponse(body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path?: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
