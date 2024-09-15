const https = require("https");
const dns = require("dns");
const urlModule = require("url");
const sslChecker = require("ssl-checker");
const Nmap = require("node-nmap");
Nmap.nmapLocation = "/usr/bin/nmap"; // Adjust if nmap is installed elsewhere
const ZAP = require("zaproxy");
const zaproxy = new ZAP({
  proxy: "http://localhost:8080", // Assuming ZAP is running locally on port 8080
  apiKey: "4sn51vsemifhc7392b6sn02i8t",
});

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

// Function to perform a ZAP scan
function runZapScan(targetUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`Starting spider scan for ${targetUrl}...`);
      const spiderScan = await zaproxy.spider.scan({ url: targetUrl });
      console.log(`Spider scan initiated with ID: ${spiderScan.scan}`);
      const scanId = spiderScan.scan;

      let status = 0;
      while (status < 100) {
        const { status: spiderStatus } = await zaproxy.spider.status(scanId);
        status = parseInt(spiderStatus, 10);
        console.log(`Spider progress: ${status}%`);
        await new Promise((r) => setTimeout(r, 5000)); // Poll every 5 seconds
      }
      console.log("Spider scan completed.");

      console.log("Starting active scan...");
      const activeScan = await zaproxy.ascan.scan({ url: targetUrl });
      console.log(`Active scan initiated with ID: ${activeScan.scan}`);
      const activeScanId = activeScan.scan;

      status = 0;
      while (status < 100) {
        const { status: activeStatus } = await zaproxy.ascan.status(
          activeScanId
        );
        status = parseInt(activeStatus, 10);
        console.log(`Active scan progress: ${status}%`);
        await new Promise((r) => setTimeout(r, 5000)); // Poll every 5 seconds
      }

      console.log("Retrieving alerts...");
      const alerts = await zaproxy.core.alerts({ baseurl: targetUrl });
      console.log(`Alerts retrieved: ${alerts.length}`);
      resolve(alerts);
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
