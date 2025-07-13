const express = require('express')
const router = express.Router()
const { readSheet } = require('../../googleSheet') // 確保這個路徑正確指向你的 googleSheet.js 檔案

// 替換為你的試算表ID與範圍
const SPREADSHEET_ID = '1SrPn-ypwQjyDvto3t6Jn540a-SwqJ4YroyV7JSgM3cM'
const RANGE = 'events!A1:C'  // 使用 events 工作表（小寫），只讀取 A、B、C 三欄

// cache 用來存儲 Google Sheets 資料
let cache = null
// 初始化 Google Sheets 資料
let isUpdatingCache = false
async function updateCache() {
    if (isUpdatingCache) return // Skip if already updating
    isUpdatingCache = true
    cache = await readSheet(SPREADSHEET_ID, RANGE)
    isUpdatingCache = false
}
updateCache()

router.get('/', async (req, res) => {
    try {
        console.log('開始獲取 events 資料...')
        
        if (!cache) {
            console.log('Cache 為空，嘗試更新...')
            await updateCache()
        }
        
        console.log('成功獲取 events 資料，條數:', cache ? cache.length : 0)
        res.json(cache)
    } catch (err) {
        console.error('獲取 events 資料時發生錯誤:', err)
        res.status(500).json({ error: err.message })
    }
})

module.exports = router