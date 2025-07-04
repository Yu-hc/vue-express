const express = require('express');
const router = express.Router();
const { readSheet } = require('../../googleSheet'); // 確保這個路徑正確指向你的 HomeView.js 檔案

// 替換為你的試算表ID與範圍
const SPREADSHEET_ID = '1SrPn-ypwQjyDvto3t6Jn540a-SwqJ4YroyV7JSgM3cM';
const RANGE = 'board!A1:Z';

router.get('/', async (req, res) => {
  try {
    const data = await readSheet(SPREADSHEET_ID, RANGE);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;