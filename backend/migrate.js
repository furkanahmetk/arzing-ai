const Database = require('better-sqlite3');
const db = new Database('casperguard.db');
try {
  db.exec('ALTER TABLE audits ADD COLUMN full_report_markdown TEXT;');
  console.log('Added full_report_markdown to audits');
} catch (e) {
  console.log('Migration error (might already exist):', e.message);
}
try {
  db.exec('ALTER TABLE validators ADD COLUMN updated_at TEXT;');
  console.log('Added updated_at to validators');
} catch (e) {
  console.log('Migration error (might already exist):', e.message);
}
