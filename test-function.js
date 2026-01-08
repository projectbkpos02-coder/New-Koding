const http = require('http');
const path = require('path');

// Load the serverless function
const handler = require('./vercel_local_output/api/index.js');

// Create a test server
const server = http.createServer(async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  await handler(req, res);
});

server.listen(3001, () => {
  console.log('Test server running on http://localhost:3001');
  console.log('Try:');
  console.log('  curl http://localhost:3001/');
  console.log('  curl http://localhost:3001/api/health');
});

setTimeout(() => {
  console.log('\n✅ Server ready for tests');
}, 500);
