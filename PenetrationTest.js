const https = require("https");
const dns = require("dns");
const urlModule = require("url");
const axios = require("axios");
const sslChecker = require("ssl-checker");
const Nmap = require("node-nmap");
Nmap.nmapLocation = "/usr/bin/nmap"; // Adjust if nmap is installed elsewhere
const { exec } = require('child_process');

Nmap.nmapLocation = 'C:\\Program Files (x86)\\Nmap\\nmap.exe'; // Adjust path as per your system

const ZapClient = require("zaproxy");
const zaproxy = new ZapClient({
  apiKey: "ca809hhas08nju3cqgl5nicomm",
  baseURL: "http://127.0.0.1:8080", // Assuming ZAP is running locally on port 8080
});
const zapUrl = 'http://127.0.0.1:8080';
const apiKey = 'ca809hhas08nju3cqgl5nicomm';

// Function to check if URL is reachable
function checkUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
        });
      })
      .on("error", (e) => {
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
    https
      .get(url, (res) => {
        res.on("data", () => {});
        res.on("end", () => {
          const end = Date.now();
          resolve(end - start);
        });
      })
      .on("error", (e) => {
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

    scan.on("complete", (data) => {
      resolve(data);
    });

    scan.on("error", (error) => {
      reject(error);
    });

    scan.startScan();
  });
}

// Function to perform Nmap vulnerability scan
function runNmapVulnScan(target) {
  return new Promise((resolve, reject) => {
    const nmapScan = new Nmap.NmapScan(target);

    nmapScan.on("complete", (data) => {
      resolve(data);
    });

    nmapScan.on("error", (error) => {
      reject(error);
    });

    nmapScan.startScan(["-sV", "--script=vuln"]);
  });
}

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

// Function to perform a ZAP scan
// function runZapScan(targetUrl) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       console.log(`Starting spider scan for ${targetUrl}...`);
//       const spiderResponse = await axios.get(`${zapUrl}/JSON/spider/action/scan/`, {
//         params: {
//           url: targetUrl,
//           apikey: apiKey
//         }
//       });
//       const spiderScanId = spiderResponse.data.scan;
//       console.log(`Spider scan initiated with ID: ${spiderScanId}`);
//     //   console.log("ZAP baseURL:", zaproxy.baseURL);
//     //   console.log(`Starting spider scan for ${targetUrl}...`);
//     //   const spiderScan = await zaproxy.spider.scan({ url: targetUrl });
//     //   console.log(`Spider scan initiated with ID: ${spiderScan.scan}`);
//     //   const scanId = spiderScan.scan;

//     //   let status = 0;
//     //   while (status < 100) {
//     //     const { status: spiderStatus } = await zaproxy.spider.status(scanId);
//     //     status = parseInt(spiderStatus, 10);
//     //     console.log(`Spider progress: ${status}%`);
//     //     await new Promise((r) => setTimeout(r, 5000)); // Poll every 5 seconds
//     //   }
//     //   console.log("Spider scan completed.");

//     //   console.log("Starting active scan...");
//     //   const activeScan = await zaproxy.ascan.scan({ url: targetUrl });
//     //   console.log(`Active scan initiated with ID: ${activeScan.scan}`);
//     //   const activeScanId = activeScan.scan;

//     //   status = 0;
//     //   while (status < 100) {
//     //     const { status: activeStatus } = await zaproxy.ascan.status(
//     //       activeScanId
//     //     );
//     //     status = parseInt(activeStatus, 10);
//     //     console.log(`Active scan progress: ${status}%`);
//     //     await new Promise((r) => setTimeout(r, 5000)); // Poll every 5 seconds
//     //   }

//     //   console.log("Retrieving alerts...");
//     //   const alerts = await zaproxy.core.alerts({ baseurl: targetUrl });
//     //   console.log(`Alerts retrieved: ${alerts.length}`);
//     //   resolve(alerts);
//     // //   const response = await axios.get('http://127.0.0.1:8080/JSON/core/view/version/?apikey=uangf6tocrkepjcruv7qr94m1s');
//     // // console.log('ZAP API is reachable:', response.data);
//     } catch (error) {
//       console.error("Error during ZAP scan:", error);
//       reject(error);
//     }
//   });
// }

function runZapScan(targetUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("ZAP baseURL:", zapUrl);
      console.log(`Starting spider scan for ${targetUrl}...`);

      // Start Spider Scan
      const spiderResponse = await axios.get(`${zapUrl}/JSON/spider/action/scan/`, {
        params: {
          url: targetUrl,
          apikey: apiKey
        }
      });
      const spiderScanId = spiderResponse.data.scan;
      console.log(`Spider scan initiated with ID: ${spiderScanId}`);

      // Poll Spider Status
      let status = 0;
      while (status < 100) {
        const statusResponse = await axios.get(`${zapUrl}/JSON/spider/view/status/`, {
          params: {
            scanid: spiderScanId,
            apikey: apiKey
          }
        });
        status = parseInt(statusResponse.data.status, 10);
        console.log(`Spider progress: ${status}%`);
        await new Promise(r => setTimeout(r, 5000)); // Poll every 5 seconds
      }
      console.log("Spider scan completed.");

      console.log("Starting active scan...");
      // Start Active Scan
      const activeResponse = await axios.get(`${zapUrl}/JSON/ascan/action/scan/`, {
        params: {
          url: targetUrl,
          apikey: apiKey
        }
      });
      const activeScanId = activeResponse.data.scan;
      console.log(`Active scan initiated with ID: ${activeScanId}`);

      // Poll Active Status
      status = 0;
      while (status < 100) {
        const activeStatusResponse = await axios.get(`${zapUrl}/JSON/ascan/view/status/`, {
          params: {
            scanid: activeScanId,
            apikey: apiKey
          }
        });
        status = parseInt(activeStatusResponse.data.status, 10);
        console.log(`Active scan progress: ${status}%`);
        await new Promise(r => setTimeout(r, 5000)); // Poll every 5 seconds
      }

      console.log("Active scan completed.");

      console.log("Retrieving alerts...");
      // Retrieve Alerts
      const alertsResponse = await axios.get(`${zapUrl}/JSON/core/view/alerts/`, {
        params: {
          baseurl: targetUrl,
          apikey: apiKey
        }
      });
      console.log(`Alerts retrieved: ${alertsResponse.data.alerts.length}`);
      resolve(alertsResponse.data);

    } catch (error) {
      console.error("Error during ZAP scan:", error);
      reject(error);
    }
  });
}

// Function to run all tools
async function runTools(url) {
  const Result = {
    urlInfo: null,
    dnsInfo: null,
    responseTime: null,
    sslInfo: null,
    nmapInfo: null,
    nmapVulnInfo: null,
    sqlmap:null,
    owaspInfo: null,
    error: null,
  };

  try {
    const parsedUrl = urlModule.parse(url);
    const hostname = parsedUrl.hostname;

    console.log("Starting URL check...");
    Result.urlInfo = await checkUrl(url);
    console.log("Checking DNS info...");
    Result.dnsInfo = await getDnsInfo(hostname);
    console.log("Measuring response time...");
    Result.responseTime = await measureResponseTime(url);
    console.log("Checking SSL info...");
    Result.sslInfo = await checkSsl(hostname);
    console.log("Running SQLmap scan...");
    Result.sqlmap = await runSQLMap(url);
    console.log("Running Nmap scan...");
    Result.nmapInfo = await runNmapScan(hostname);
    console.log("Running Nmap vulnerability scan...");
    Result.nmapVulnInfo = await runNmapVulnScan(hostname);
    console.log("Running OWASP ZAP scan...");
    Result.owaspInfo = await runZapScan(url);

    console.log("All scans completed.");
  } catch (error) {
    console.error("Error occurred during scan:", error);
    Result.error = error;
  }

  return Result;
}

module.exports = { runTools };
