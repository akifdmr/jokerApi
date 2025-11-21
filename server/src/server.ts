import express from "express";
import path from "path";
import {balanceRouter } from "./routes/balanceRouter.js"
import { fileURLToPath } from "url";
import { connectDB } from "./core/db";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectDB();



// API 
app.use("/joker/api", balanceRouter);


app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});
app.listen(PORT, () => {
  console.log(`🔥 Server started on port ${PORT}`);
});
