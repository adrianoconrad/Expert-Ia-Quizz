import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("quiz.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    date TEXT,
    correct INTEGER,
    total INTEGER,
    timeSpent INTEGER,
    fileName TEXT,
    questions TEXT,
    answers TEXT,
    content TEXT
  );
`);

// Migration: Add questions, answers, and content columns if they don't exist
try {
  const tableInfo = db.prepare("PRAGMA table_info(history)").all() as any[];
  const hasQuestions = tableInfo.some(col => col.name === 'questions');
  const hasAnswers = tableInfo.some(col => col.name === 'answers');
  const hasContent = tableInfo.some(col => col.name === 'content');
  
  if (!hasQuestions) {
    db.prepare("ALTER TABLE history ADD COLUMN questions TEXT").run();
  }
  if (!hasAnswers) {
    db.prepare("ALTER TABLE history ADD COLUMN answers TEXT").run();
  }
  if (!hasContent) {
    db.prepare("ALTER TABLE history ADD COLUMN content TEXT").run();
  }
} catch (e) {
  console.error("Migration failed", e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/history", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM history ORDER BY date DESC").all();
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.post("/api/history", (req, res) => {
    try {
      const { id, date, correct, total, timeSpent, fileName, questions, answers, content } = req.body;
      const stmt = db.prepare(`
        INSERT INTO history (id, date, correct, total, timeSpent, fileName, questions, answers, content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, date, correct, total, timeSpent, fileName, questions, answers, content);
      res.json({ success: true });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to save history" });
    }
  });

  app.delete("/api/history/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.prepare("DELETE FROM history WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete history item" });
    }
  });

  // Backup & Restore
  app.get("/api/backup", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM history").all();
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate backup" });
    }
  });

    app.post("/api/restore", (req, res) => {
    try {
      const history = req.body;
      if (!Array.isArray(history)) {
        return res.status(400).json({ error: "Invalid backup format" });
      }

      const insert = db.prepare(`
        INSERT OR REPLACE INTO history (id, date, correct, total, timeSpent, fileName, questions, answers, content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((items) => {
        for (const item of items) {
          insert.run(
            item.id, 
            item.date, 
            item.correct, 
            item.total, 
            item.timeSpent, 
            item.fileName, 
            item.questions || '[]', 
            item.answers || '[]',
            item.content || null
          );
        }
      });

      transaction(history);
      res.json({ success: true });
    } catch (error) {
      console.error("Restore error:", error);
      res.status(500).json({ error: "Failed to restore backup" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
