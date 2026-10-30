// Runs the bridge against a local copy of the R2 bucket.
// Usage: node test/run.mjs <r2-dir> [iso-time] [route]
import { readFile } from "node:fs/promises";
import worker from "../src/index.js";

const [dir, when, route = "/morning"] = process.argv.slice(2);
if (when) {
  const fixed = new Date(when).getTime();
  const RealDate = Date;
  globalThis.Date = class extends RealDate {
    constructor(...a) { super(...(a.length ? a : [fixed])); }
    static now() { return fixed; }
  };
}

const env = {
  API_KEY: "test",
  FORECAST: {
    async get(key) {
      try {
        const text = await readFile(`${dir}/${key}`, "utf8");
        return { json: async () => JSON.parse(text), text: async () => text };
      } catch { return null; }
    },
  },
};

const res = await worker.fetch(new Request(`https://x${route}`, { headers: { "X-Api-Key": "test" } }), env);
console.log(res.status, await res.text());
