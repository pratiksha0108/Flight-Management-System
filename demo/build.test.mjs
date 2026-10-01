import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
test("deployment uses a self-contained versioned bundle and recovery UI", async () => {
  execFileSync(process.execPath, [
    new URL("./build.mjs", import.meta.url).pathname,
  ]);
  const html = await readFile(
    new URL("../site/index.html", import.meta.url),
    "utf8",
  );
  assert.match(html, /app\.[a-f0-9]{12}\.js/);
  assert.match(html, /style\.[a-f0-9]{12}\.css/);
  assert.doesNotMatch(html, /type="module"/);
  assert.match(html, /bootFailure/);
});
