const Groq = require("groq-sdk");
const cors = require("cors");
const express = require("express");
const { runTools } = require("./PenetrationTest.js");
const dotenv = require("dotenv");
const PDFDocument = require("pdfkit");

dotenv.config();
const port = 3000;
const app = express(); // Initialize express app

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

app.post("/generate", async (req, res) => {
  console.log("from server");
  const websiteLink = req.body.url;
  console.log(`Received link: ${websiteLink}`);

  try {
    const result = await runTools(websiteLink);
    console.log("Response", result);

    const prompt = `Generate a detailed document of maximum pages (each page consists of content of actual page) on the following results: ${JSON.stringify(
      result,
      null,
      2
    )} \n\nExplain each vulnerability in depth. It doesnt matter how long document goes. Provide solutions to each vulnerability with recommendations of best practices. Bold the key points and explain them separately at the end of the document in the section of important terminologies. DONT use bullet points at all!!!`;

    if (!result.error) {
      const chatCompletion = await getGroqChatCompletion(prompt);
      const report = chatCompletion.choices[0]?.message?.content;

      // Create PDF document
      const doc = new PDFDocument({ autoFirstPage: false });

      // Set headers to return the PDF file
      res.setHeader("Content-Disposition", "inline; filename=report.pdf");
      res.setHeader("Content-Type", "application/pdf");

      // Pipe PDF document to response
      doc.pipe(res);

      // Add title page
      doc.addPage();
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("Penetration Testing Report", { align: "center" });
      doc.moveDown(2);

      // Add content to PDF
      addContentToPDF(doc, report);

      // Finalize PDF document
      doc.end();
    } else {
      res.status(400).send("No such URL found");
    }
  } catch (error) {
    console.error("Error fetching the URL or running tools:", error.message);
    res.status(400).send("No such URL or an error occurred.");
  }
});

async function getGroqChatCompletion(userQuery) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: userQuery,
      },
    ],
    model: "llama3-8b-8192",
  });
}

function addContentToPDF(doc, content) {
  const lines = content.split("\n");
  let isBold = false;
  let isHeading = false;

  lines.forEach((line) => {
    if (line.startsWith("# ")) {
      // Heading 1
      if (!isHeading) {
        doc.addPage();
        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .text(line.replace(/^# /, ""), { align: "left", lineGap: 10 });
        doc.moveDown(1);
        isHeading = true;
      }
    } else if (line.startsWith("## ")) {
      // Heading 2
      if (isHeading) {
        doc.moveDown(0.5);
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text(line.replace(/^## /, ""), { align: "left", lineGap: 8 });
        doc.moveDown(0.5);
      }
    } else if (line.startsWith("### ")) {
      // Heading 3
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(line.replace(/^### /, ""), { align: "left", lineGap: 6 });
      doc.moveDown(0.5);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      // Bold text
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(line.replace(/\*\*/g, ""), { align: "left", lineGap: 6 });
      isBold = true;
    } else {
      // Normal text
      doc
        .fontSize(12)
        .font("Helvetica")
        .text(line, { align: "left", lineGap: 4 });
      if (isHeading) {
        doc.moveDown(1);
        isHeading = false;
      }
    }
  });
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
