const db = require('./db/pool');
const app = require('./app');

async function start() {
  await db.query('SELECT "serviceId" FROM "Service" LIMIT 1');
  const server = app.listen(Number(process.env.PORT || 3001), () => {
    console.log(`Backend running on http://localhost:${server.address().port}`);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      server.close(async () => { await db.close(); process.exit(0); });
    });
  }
  return server;
}

if (require.main === module) {
  start().catch(async (error) => {
    console.error('Backend startup failed. Check DATABASE_URL and run npm run db:migrate.', error.code || '');
    await db.close();
    process.exitCode = 1;
  });
}

module.exports = { start };
