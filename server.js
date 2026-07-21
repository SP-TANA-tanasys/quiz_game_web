const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());  // ← これで全てのオリジンからのリクエストを許可
app.use(express.json());

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.post("/login", (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
});

app.listen(10000);