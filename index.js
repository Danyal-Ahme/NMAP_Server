const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;
const axios = require("axios");
const { runDiagnostics } = require("./DiagnosticTest")
// Middleware
app.use(cors()); 
app.use(express.json());

// Example route
app.get("/", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

app.post("/generate", async (req, res) => {
  console.log("from server");
  const websiteLink =  req.body.url; // Ensure the key matches the frontend
  console.log(`Received link: ${websiteLink}`);
  const result = await runDiagnostics(websiteLink);
  console.log("Response", result);
  try {

    const response = await axios.get(websiteLink);
    if (response.status >= 200 && response.status < 300) {
      // Here the logic for diagnostic test will come
      
      const responseObj = {
        websiteLink: websiteLink,
        diagnostics: result,
      };
      res.json(responseObj); // Use res.json for sending JSON response
    } else {
      res.status(400).send("No such URL found");
    }
  } catch (error) {
    res.status(400).send("No such URL");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
