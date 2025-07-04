const express = require('express')
const router = express.Router()
const { readSheet } = require('../../googleSheet') // 確保這個路徑正確指向你的 HomeView.js 檔案

// 替換為你的試算表ID與範圍
const SPREADSHEET_ID = '1SrPn-ypwQjyDvto3t6Jn540a-SwqJ4YroyV7JSgM3cM'
const RANGE = 'board!A1:Z'

// cache 用來存儲 Google Sheets 資料
let cache = null
// 初始化 Google Sheets 資料
async function updateCache(params) {
	cache = await readSheet(SPREADSHEET_ID, RANGE)
}
updateCache()

router.get('/', async (req, res) => {
	try {
		if (!cache) {
			await updateCache()
		}
		res.json(cache)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

module.exports = router
