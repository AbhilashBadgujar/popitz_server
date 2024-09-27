const { spawn } = require('child_process');
const path = require('path');

// Start the server
const server = spawn('node', [path.join(__dirname, 'index.js')], { stdio: 'inherit' });

console.log('Starting server...');

// Wait for 5 seconds before starting clients
setTimeout(() => {
  console.log('Starting clients...');
  
  // Start client1
  const client1 = spawn('node', [path.join(__dirname, 'client1.js')], { stdio: 'inherit' });
  
  // Start client2
  const client2 = spawn('node', [path.join(__dirname, 'client2.js')], { stdio: 'inherit' });

  // Handle process exit
  process.on('exit', () => {
    server.kill();
    client1.kill();
    client2.kill();
  });

}, 5000);  // 5000 ms = 5 seconds