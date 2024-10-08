const https = require('https');
const dns = require('dns');
const urlModule = require('url');
const sslChecker = require('ssl-checker');
const Nmap = require('node-nmap');
const { exec } = require('child_process');

Nmap.nmapLocation = 'C:\\Program Files (x86)\\Nmap\\nmap.exe'; // Adjust path as per your system

// Function to check if URL is reachable
function checkUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
      });
    }).on('error', (e) => {
      reject(e);
    });
  });
}

// Function to get DNS information
function getDnsInfo(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, (err, address, family) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          address: address,
          family: family,
        });
      }
    });
  });
}

// Function to measure response time
function measureResponseTime(url) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    https.get(url, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        const end = Date.now();
        resolve(end - start);
      });
    }).on('error', (e) => {
      reject(e);
    });
  });
}

// Function to check SSL information
function checkSsl(hostName) {
  return sslChecker(hostName);
}

// Function to perform an Nmap scan
function runNmapScan(target) {
  return new Promise((resolve, reject) => {
    const scan = new Nmap.NmapScan(target);

    scan.on('complete', (data) => {
      resolve(data);
    });

    scan.on('error', (error) => {
      reject(error);
    });

    scan.startScan();
  });
}

// Function to perform Nmap vulnerability scan
function runNmapVulnScan(target) {
  return new Promise((resolve, reject) => {
    const nmapScan = new Nmap.NmapScan(target);

    nmapScan.on('complete', (data) => {
      resolve(data);
    });

    nmapScan.on('error', (error) => {
      reject(error);
    });

    nmapScan.startScan(['-sV', '--script=vuln']);
  });
}

// Function to run SQLmap
function runSQLMap(url) {
  return new Promise((resolve, reject) => {
    const pythonPath = `"C:\\Program Files\\Python312\\python.exe"`; // Adjust this path
    const sqlmapPath = `"C:\\Program Files\\sqlmapproject-sqlmap-51cdc98\\sqlmap.py"`; // Adjust this path
    const command = `${pythonPath} ${sqlmapPath} -u "${url}" --batch`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing SQLmap: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`SQLmap stderr: ${stderr}`);
        reject(new Error(stderr));
        return;
      }

      // Parse and filter SQLmap output
      const outputLines = stdout.split('\n');
      const relevantResults = outputLines.filter(line => 
        line.includes('[ERROR]') || line.includes('[INFO]')
      );

      // Resolve with filtered results
      resolve(relevantResults);
    });
  });
}

async function runDiagnostics(url) {
  const diagnostics = {
    urlInfo: null,
    dnsInfo: null,
    responseTime: null,
    sslInfo: null,
    nmapInfo: null,
    nmapVulnInfo: null,
    sqlmapInfo: null,
    error: null,
  };

  try {
    const parsedUrl = urlModule.parse(url);
    const hostname = parsedUrl.hostname;
    console.log("Loading");
    diagnostics.urlInfo = await checkUrl(url);
    diagnostics.dnsInfo = await getDnsInfo(hostname);
    diagnostics.responseTime = await measureResponseTime(url);
    diagnostics.sslInfo = await checkSsl(hostname);

    // Run Nmap scan based on the hostname or IP address
    diagnostics.nmapInfo = await runNmapScan(hostname);

    // Run Nmap vulnerability scan
    diagnostics.nmapVulnInfo = await runNmapVulnScan(hostname);

    // Run SQLmap scan
    diagnostics.sqlmapInfo = await runSQLMap(url);

    console.log(diagnostics);
  } catch (error) {
    console.error('Error:', error);
    diagnostics.error = error;
  }
  return diagnostics;
}

module.exports = { runDiagnostics };
