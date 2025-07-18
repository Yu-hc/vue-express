const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const router = express.Router();

// MongoDB 連接配置
const MONGODB_URI = 'mongodb+srv://ntusfa:ntusfa@ntusfa.ffgku3g.mongodb.net/?retryWrites=true&w=majority&appName=NTUSFA';
const DB_NAME = 'ntusfa-web';

let db;

// 初始化 MongoDB 連接
async function initDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log('MongoDB connected successfully for records');
    } catch (error) {
        console.error('MongoDB connection error for records:', error);
    }
}

initDB();

// 獲取所有借閱記錄
router.get('/', async (req, res) => {
    try {
        console.log('API /records called');
        
        // 檢查資料庫連接
        if (!db) {
            console.error('Database not connected');
            return res.status(500).json({
                success: false,
                error: 'Database not connected'
            });
        }
        
        // 獲取所有借閱記錄
        const records = await db.collection('records').find({}).toArray();
        console.log(`Found ${records.length} records in database`);
        
        res.status(200).json({
            success: true,
            data: records
        });
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch records'
        });
    }
});

// 新增借閱記錄
router.post('/', async (req, res) => {
    try {
        console.log('API /records POST called');
        
        // 檢查資料庫連接
        if (!db) {
            console.error('Database not connected');
            return res.status(500).json({
                success: false,
                error: 'Database not connected'
            });
        }
        
        // 解析記錄數據
        const recordData = JSON.parse(req.body.value);
        
        // 添加時間戳
        recordData.createdAt = new Date();
        recordData.updatedAt = new Date();
        
        // 插入記錄到 MongoDB
        const result = await db.collection('records').insertOne(recordData);
        
        console.log('Record inserted:', result.insertedId);
        
        res.status(200).json({
            success: true,
            recordId: result.insertedId,
            message: 'Record created successfully'
        });
    } catch (error) {
        console.error('Error creating record:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create record'
        });
    }
});

// 更新借閱記錄（例如歸還書籍）
router.put('/:id', async (req, res) => {
    try {
        console.log('API /records PUT called');
        
        // 檢查資料庫連接
        if (!db) {
            console.error('Database not connected');
            return res.status(500).json({
                success: false,
                error: 'Database not connected'
            });
        }
        
        const recordId = req.params.id;
        const updateData = req.body;
        
        // 添加更新時間戳
        updateData.updatedAt = new Date();
        
        // 更新記錄
        const result = await db.collection('records').updateOne(
            { _id: new ObjectId(recordId) },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }
        
        console.log('Record updated:', recordId);
        
        res.status(200).json({
            success: true,
            message: 'Record updated successfully'
        });
    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update record'
        });
    }
});

// 刪除借閱記錄
router.delete('/:id', async (req, res) => {
    try {
        console.log('API /records DELETE called');
        
        // 檢查資料庫連接
        if (!db) {
            console.error('Database not connected');
            return res.status(500).json({
                success: false,
                error: 'Database not connected'
            });
        }
        
        const recordId = req.params.id;
        
        // 刪除記錄
        const result = await db.collection('records').deleteOne(
            { _id: new ObjectId(recordId) }
        );
        
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }
        
        console.log('Record deleted:', recordId);
        
        res.status(200).json({
            success: true,
            message: 'Record deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete record'
        });
    }
});

module.exports = router;
