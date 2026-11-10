const net = require('node:net');

const endpoints = [
  ['Auth', 9099],
  ['Firestore', 8080],
  ['Functions', 5001],
  ['Storage', 9199],
  ['Emulator UI', 4000],
  ['Emulator Hub', 4400],
  ['Emulator logging', 4500],
];

function checkPort(name, port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(3000);
    socket.once('connect', () => {
      socket.destroy();
      console.log(`PASS ${name} 127.0.0.1:${port}`);
      resolve();
    });
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error(`${name} did not respond on port ${port} before timeout`));
    });
    socket.once('error', (error) => reject(new Error(`${name} port ${port}: ${error.message}`)));
  });
}

Promise.all(endpoints.map(([name, port]) => checkPort(name, port))).catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
});
