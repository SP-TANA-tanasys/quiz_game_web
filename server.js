const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const app = express();

// posgre接続
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// クイズデータの保存ディレクトリ
const quizDir = path.join(__dirname, "quizzes");
if (!fs.existsSync(quizDir)) {
  fs.mkdirSync(quizDir);
}

// 難易度ごとのJSONファイルパス
function getQuizPath(difficulty) {
  return path.join(quizDir, `${difficulty}_quiz.json`);
}

// JSONファイルを読み込む
function loadQuizzes(difficulty) {
  const filePath = getQuizPath(difficulty);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
  return [];
}

// JSONファイルに保存
function saveQuizzes(difficulty, quizzes) {
  const filePath = getQuizPath(difficulty);
  try {
    fs.writeFileSync(filePath, JSON.stringify(quizzes, null, 2), "utf-8");
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e);
    throw e;
  }
}

async function saveQuizToDB(difficulty, quiz) {
  await pool.query(
    `INSERT INTO questions
      (difficulty, question, answer, explanation)
     VALUES ($1, $2, $3, $4)`,
    [
      difficulty,
      quiz.question,
      quiz.answer,
      quiz.explanation
    ]
  );
}

// ログイン処理
app.post("/login", (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
});

// クイズを取得
app.get("/get-quiz", async (req, res) => {
  const difficulty = req.query.difficulty || "easy";
  const quizzes = loadQuizzes(difficulty);
  res.json(quizzes);
});

// クイズを保存
app.post("/save-quiz", async (req, res) => {
  console.log("===== /save-quiz =====");
  console.log(req.body);

  const { difficulty, quizData } = req.body;

  if (!difficulty || !quizData) {
    console.log("データ不足");
    return res.status(400).json({
      ok: false,
      message: "難易度と問題データが必要です"
    });
  }

  try {
    console.log("DBへ保存開始");
    await saveQuizToDB(difficulty, quizData);
    console.log("DBへ保存成功");

    res.json({
      ok: true,
      message: "問題を保存しました"
    });

  } catch (e) {
    console.error("DB保存エラー");
    console.error(e);

    res.status(500).json({
      ok: false,
      message: "保存失敗"
    });
  }
});


app.listen(10000, () => {
  console.log("Server running on port 10000");
});
