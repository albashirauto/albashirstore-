// npm run db:push            -> run every new migration in supabase/, in order
// npm run db:push -- 003_demo_data.sql   -> run one file on purpose (e.g. demo data)
//
// Needs SUPABASE_DB_URL in .env.local (Supabase > Connect > "Session pooler" connection string).
// Remembers what ran in the table public._migrations, so each file runs once.
// Demo files (003, 004) never run automatically.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dir = join(root, "supabase");
const MANUAL = ["003_demo_data.sql", "004_remove_demo.sql"];

// tiny .env.local reader (no extra package)
const envFile = join(root, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.SUPABASE_DB_URL;
if (!url || url.includes("YOUR-PASSWORD")) {
  console.error("\n  SUPABASE_DB_URL is missing in .env.local.\n  Supabase > Connect > Session pooler > copy the URI, put your database password in it, then:\n  SUPABASE_DB_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-xx.pooler.supabase.com:5432/postgres\n");
  process.exit(1);
}

const only = process.argv.slice(2).filter((a) => a.endsWith(".sql"));
const all = ["schema.sql", ...readdirSync(dir).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort()];
const files = only.length ? only : all.filter((f) => !MANUAL.includes(f));

// Read the URL by hand so a password containing @ # / : ? still works (split at the LAST @).
const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^@/:]+)(?::(\d+))?\/([^?]+)/);
if (!m) { console.error("\n  SUPABASE_DB_URL does not look like postgresql://user:password@host:5432/postgres\n"); process.exit(1); }
const client = new pg.Client({ user: m[1], password: m[2], host: m[3], port: Number(m[4] || 5432), database: m[5], ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query("create table if not exists public._migrations (file text primary key, ran_at timestamptz default now())");
await client.query("alter table public._migrations enable row level security"); // nobody but the database owner can read it
const done = new Set((await client.query("select file from public._migrations")).rows.map((r) => r.file));

let ran = 0;
for (const f of files) {
  if (!only.length && done.has(f)) { console.log(`  skip  ${f} (already ran)`); continue; }
  process.stdout.write(`  run   ${f} … `);
  try {
    await client.query("begin");
    await client.query(readFileSync(join(dir, f), "utf8"));
    await client.query("insert into public._migrations (file) values ($1) on conflict (file) do update set ran_at = now()", [f]);
    await client.query("commit");
    console.log("ok");
    ran++;
  } catch (e) {
    await client.query("rollback");
    console.log("FAILED");
    console.error(`\n  ${f}: ${e.message}\n  Nothing from this file was saved. Fix it and run again.\n`);
    await client.end();
    process.exit(1);
  }
}
await client.end();
console.log(`\n  Done. ${ran} file${ran === 1 ? "" : "s"} ran.\n`);
