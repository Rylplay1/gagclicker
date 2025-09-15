// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');

const app = express();
app.use(express.json()); // Use this middleware to parse JSON body

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// GitHub Webhook Secret (Replace with your actual secret)
const GITHUB_SECRET = 'your-secret-key';

// Store all connected WebSocket clients
wss.on('connection', ws => {
  console.log('Client connected');
});

// Endpoint to receive GitHub webhooks
app.post('/github-webhook', (req, res) => {
  const githubSignature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);

  if (!githubSignature) {
    return res.status(400).send('Signature missing');
  }

  // Verify the webhook signature for security
  const hmac = crypto.createHmac('sha256', GITHUB_SECRET);
  const signature = `sha256=${hmac.update(payload).digest('hex')}`;

  if (crypto.timingSafeEqual(Buffer.from(githubSignature), Buffer.from(signature))) {
    console.log('Webhook signature verified');
    
    // Broadcast the event data to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });

    res.status(200).send('Webhook received and processed');
  } else {
    console.log('Webhook signature mismatch');
    res.status(401).send('Invalid signature');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});