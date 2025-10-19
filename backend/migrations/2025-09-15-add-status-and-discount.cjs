const fs = require('fs');
const path = require('path');

exports.up = async function(knex) {
  const sqlPath = path.resolve(__dirname, '..', '..', 'db', 'migrations', '2025-09-15-add-status-and-discount.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const stmts = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
  for (const stmt of stmts) {
    try {
      await knex.raw(stmt);
    } catch (err) {
      if (err && (err.errno === 1060 || err.errno === 1050)) {
        console.warn('Ignoring benign migration error:', err.message);
        continue;
      }
      throw err;
    }
  }
};

exports.down = async function(knex) {
  // Rollback intentionally left empty; manual rollback recommended
};
