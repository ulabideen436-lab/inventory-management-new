// Minimal server test
import http from 'http';

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', message: 'Minimal server is working' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

const PORT = 5002;

server.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
  console.log(`Test with: http://localhost:${PORT}/health`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});