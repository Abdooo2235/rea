import { describe, expect, it } from "vitest";

import { analyzeJavaScriptStaticSource } from "./javascriptStaticAnalysis.js";

describe("SQLite constructor identity", () => {
  it.each([
    'class Database { constructor(name) { this.name = name; } } new Database("hello");',
    'function run(Database) { return new Database("hello"); }',
    'const app = { Database: class {} }; new app.Database("hello");',
    'import Database from "unrelated"; new Database("hello");',
    'new Database("hello");',
    'import Database from "better-sqlite3"; function run(Database) { return new Database("hello"); }',
    'let Database = require("better-sqlite3"); Database = class {}; new Database("hello");',
    'const sqlite = require("sqlite3"); sqlite.Database = class {}; new sqlite.Database("hello");',
    'const sqlite = require("sqlite3"); const alias = sqlite; alias.Database = class {}; new sqlite.Database("hello");',
    'const sqlite = require("sqlite3"); sqlite.Database = class {}; const Database = sqlite.Database; new Database("hello");',
    'function require(name) { return class {}; } const Database = require("better-sqlite3"); new Database("hello");',
    'import type { Database } from "sqlite3"; new Database("hello");',
    'const first = require("sqlite3"); first.Database = class {}; const second = require("sqlite3"); new second.Database("hello");',
    'import first from "sqlite3"; first.Database = class {}; import second from "sqlite3"; new second.Database("hello");',
  ])("does not infer SQLite from a constructor name: %s", (source) => {
    const analysis = analyzeJavaScriptStaticSource(source);
    expect(analysis.parse_status).toBe("complete");
    expect(analysis.storage).toEqual([]);
  });

  it.each([
    'import Database from "better-sqlite3"; new Database("fixture.db");',
    'const Database = require("better-sqlite3"); new Database("fixture.db");',
    'import { Database } from "sqlite3"; new Database("fixture.db");',
    'import * as sqlite from "sqlite3"; new sqlite.Database("fixture.db");',
    'const sqlite = require("sqlite3"); new sqlite.Database("fixture.db");',
    'const { Database } = require("sqlite3"); new Database("fixture.db");',
    'function open() { const sqlite = require("sqlite3"); return new sqlite.Database("fixture.db"); }',
    'const sqlite = require("sqlite3"); function open() { return new sqlite.Database("fixture.db"); }',
    'const sqlite = require("sqlite3"); const Database = sqlite.Database; sqlite.Database = class {}; new Database("fixture.db");',
  ])("retains the SQLite constructor's module identity: %s", (source) => {
    const analysis = analyzeJavaScriptStaticSource(source);
    expect(analysis.parse_status).toBe("complete");
    expect(analysis.storage).toEqual([
      expect.objectContaining({ kind: "sqlite", name: "fixture.db" }),
    ]);
  });
});
