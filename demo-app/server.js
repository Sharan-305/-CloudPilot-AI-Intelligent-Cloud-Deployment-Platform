const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let leakStorage = [];
let simulatedStatus = 'healthy';

app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'CloudPilot Demo Microservice',
    version: '1.2.0',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    uptime_seconds: process.uptime(),
  });
});

// Standard healthcheck endpoint
app.get('/health', (req, res) => {
  if (simulatedStatus === 'unhealthy') {
    return res.status(503).json({ status: 'unhealthy', error: 'Simulated service failure' });
  }
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    memory_usage: process.memoryUsage(),
    uptime: process.uptime(),
  });
});

// Chaos / Anomaly Simulator: High CPU
app.get('/stress/cpu', (req, res) => {
  const durationMs = parseInt(req.query.duration || '2000');
  const start = Date.now();
  while (Date.now() - start < durationMs) {
    Math.sqrt(Math.random() * Math.random());
  }
  res.json({ message: `CPU stressed for ${durationMs}ms`, cpu_status: 'spiked' });
});

// Chaos / Anomaly Simulator: Memory Leak
app.get('/stress/memory', (req, res) => {
  const chunks = parseInt(req.query.mb || '50');
  const buffer = Buffer.alloc(chunks * 1024 * 1024, 'x');
  leakStorage.push(buffer);
  res.json({
    message: `Allocated ~${chunks}MB of heap memory`,
    total_leaked_mb: leakStorage.length * chunks,
    heap_used: process.memoryUsage().heapUsed,
  });
});

// Chaos / Anomaly Simulator: Artificial High Latency
app.get('/stress/latency', (req, res) => {
  const delayMs = parseInt(req.query.delay || '800');
  setTimeout(() => {
    res.json({ message: `Artificial delay of ${delayMs}ms introduced`, latency_ms: delayMs });
  }, delayMs);
});

// Chaos / Anomaly Simulator: Process Crash
app.get('/stress/crash', (req, res) => {
  res.status(500).json({ message: 'Process termination command dispatched' });
  setTimeout(() => {
    process.exit(1);
  }, 100);
});

app.listen(PORT, () => {
  console.log(`[CloudPilot Demo App] Listening on port ${PORT}`);
});
