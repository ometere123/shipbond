const baseUrl = process.env.SHIPBOND_BASE_URL ?? "http://127.0.0.1:3001";

const routes = [
  "/",
  "/connect",
  "/app/port",
  "/app/verdicts",
  "/app/contract-trace",
  "/app/settings",
];

const results = [];

for (const route of routes) {
  const url = `${baseUrl}${route}`;
  const started = Date.now();
  try {
    const response = await fetch(url, { redirect: "manual" });
    const text = await response.text();
    const hasNextError = text.includes("__next_error__") || text.includes("Application error");
    results.push({
      route,
      status: response.status,
      ms: Date.now() - started,
      ok: response.status < 500 && !hasNextError,
    });
  } catch (error) {
    results.push({
      route,
      status: "ERR",
      ms: Date.now() - started,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

console.table(results);

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  console.error(`Route smoke failed for ${failed.length} route(s).`);
  process.exit(1);
}

console.log("Route smoke passed.");
