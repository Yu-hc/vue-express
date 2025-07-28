const express = require('express')
const { MongoClient, ObjectId } = require('mongodb')
const router = express.Router()

// MongoDB 連接配置
const MONGODB_URI =
	'mongodb+srv://ntusfa:ntusfa@ntusfa.ffgku3g.mongodb.net/?retryWrites=true&w=majority&appName=NTUSFA'
const DB_NAME = 'ntusfa-web'

let db

// 初始化 MongoDB 連接
async function initDB() {
	try {
		const client = new MongoClient(MONGODB_URI)
		await client.connect()
		db = client.db(DB_NAME)
		console.log('MongoDB connected successfully')
	} catch (error) {
		console.error('MongoDB connection error:', error)
	}
}

initDB()

// 獲取所有評論（包含用戶資訊和回覆）
router.get('/', async (req, res) => {
	try {
		console.log('API /reviews called')

		// 檢查資料庫連接
		if (!db) {
			console.error('Database not connected')
			return res.status(500).json({
				success: false,
				error: 'Database not connected',
			})
		}

		// 先檢查是否有資料
		const reviewCount = await db.collection('reviews').countDocuments()
		console.log(`Found ${reviewCount} reviews in database`)

		const reviews = await db
			.collection('reviews')
			.aggregate([
				{
					$lookup: {
						from: 'users',
						localField: 'userId',
						foreignField: '_id',
						as: 'user',
					},
				},
				{
					$lookup: {
						from: 'comments',
						let: { reviewId: '$_id' },
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{ $eq: ['$reviewId', '$$reviewId'] },
											{ $eq: ['$parentId', null] },
										],
									},
								},
							},
							{
								$lookup: {
									from: 'users',
									localField: 'userId',
									foreignField: '_id',
									as: 'commentUser',
								},
							},
							{
								$lookup: {
									from: 'comments',
									let: { parentId: '$_id' },
									pipeline: [
										{
											$match: {
												$expr: { $eq: ['$parentId', '$$parentId'] },
											},
										},
										{
											$lookup: {
												from: 'users',
												localField: 'userId',
												foreignField: '_id',
												as: 'replyUser',
											},
										},
										{
											$unwind: '$replyUser',
										},
									],
									as: 'replies',
								},
							},
							{
								$unwind: '$commentUser',
							},
						],
						as: 'comments',
					},
				},
				{
					$unwind: '$user',
				},
				{
					$sort: { createdAt: -1 },
				},
			])
			.toArray()

		// 轉換資料格式以符合前端需求
		const formattedReviews = reviews.map((review) => ({
			id: review._id,
			title: review.subject,
			tags: review.tags,
			content: review.content,
			rating: review.rate,
			author: review.user.nickname,
			date: review.createdAt.toISOString().split('T')[0],
			// 完整的評論結構，包含所有相關的回覆
			comments: review.comments.map((comment) => ({
				id: comment._id,
				author: comment.commentUser.nickname,
				date: comment.createdAt.toISOString().split('T')[0],
				content: comment.content,
				replies: comment.replies.map((reply) => ({
					id: reply._id,
					author: reply.replyUser.nickname,
					date: reply.createdAt.toISOString().split('T')[0],
					content: reply.content,
				})),
			})),
		}))

		res.json({
			success: true,
			data: formattedReviews,
		})
	} catch (error) {
		console.error('Error fetching reviews:', error)
		res.status(500).json({
			success: false,
			error: 'Failed to fetch reviews',
		})
	}
})

// 獲取所有標籤
router.get('/tags', async (req, res) => {
	try {
		const tags = await db
			.collection('reviews')
			.aggregate([
				{ $unwind: '$tags' },
				{ $group: { _id: '$tags', count: { $sum: 1 } } },
				{ $sort: { count: -1 } },
				{ $project: { tag: '$_id', count: 1, _id: 0 } },
			])
			.toArray()

		res.json({
			success: true,
			data: tags.map((t) => t.tag),
		})
	} catch (error) {
		console.error('Error fetching tags:', error)
		res.status(500).json({
			success: false,
			error: 'Failed to fetch tags',
		})
	}
})

// 新增評論
router.post('/', async (req, res) => {
	try {
		const { userId, subject, content, rate, tags } = req.body

		const newReview = {
			userId: new ObjectId(userId),
			subject,
			content,
			rate: parseInt(rate),
			tags: Array.isArray(tags) ? tags : [tags],
			createdAt: new Date(),
		}

		const result = await db.collection('reviews').insertOne(newReview)

		res.json({
			success: true,
			data: {
				id: result.insertedId,
				...newReview,
			},
		})
	} catch (error) {
		console.error('Error creating review:', error)
		res.status(500).json({
			success: false,
			error: 'Failed to create review',
		})
	}
})

// 新增評論回覆
router.post('/:reviewId/comments', async (req, res) => {
	try {
		const { reviewId } = req.params
		const { userId, content, parentId = null } = req.body

		const newComment = {
			reviewId: new ObjectId(reviewId),
			userId: new ObjectId(userId),
			parentId: parentId ? new ObjectId(parentId) : null,
			content,
			createdAt: new Date(),
		}

		const result = await db.collection('comments').insertOne(newComment)

		res.json({
			success: true,
			data: {
				id: result.insertedId,
				...newComment,
			},
		})
	} catch (error) {
		console.error('Error creating comment:', error)
		res.status(500).json({
			success: false,
			error: 'Failed to create comment',
		})
	}
})

// 用戶登入
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body

		if (!email || !password) {
			return res.status(400).json({
				success: false,
				error: 'Email and password are required',
			})
		}

		// 確保資料庫連接
		if (!db) {
			return res.status(500).json({
				success: false,
				error: 'Database not connected',
			})
		}

		// 查找用戶
		const user = await db.collection('users').findOne({ email })

		if (!user) {
			return res.status(401).json({
				success: false,
				error: 'User not found',
			})
		}

		// 比對密碼 - 接受資料庫中儲存的原始密碼
		// 如果是加密密碼，直接比對；如果是明文密碼，也直接比對
		if (user.password !== password) {
			return res.status(401).json({
				success: false,
				error: 'Invalid password',
			})
		}

		// 登入成功，回傳用戶資訊 (不包含密碼)
		const { password: _, ...userWithoutPassword } = user

		res.json({
			success: true,
			data: {
				user: user,
				message: 'Login successful',
			},
		})
	} catch (error) {
		console.error('Error during login:', error)
		res.status(500).json({
			success: false,
			error: 'Login failed',
		})
	}
})

// 創建測試用戶 (僅供開發使用)
router.post('/create-test-user', async (req, res) => {
	try {
		if (!db) {
			return res.status(500).json({
				success: false,
				error: 'Database not connected',
			})
		}

		const testUser = {
			name: '張小明',
			email: 'ming.zhang@email.com',
			password: 'password123', // 簡單密碼，實際應用請使用加密
			nickname: '小明',
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		// 檢查用戶是否已存在
		const existingUser = await db.collection('users').findOne({ email: testUser.email })
		if (existingUser) {
			return res.json({
				success: true,
				message: 'Test user already exists',
				data: testUser,
			})
		}

		// 創建新用戶
		await db.collection('users').insertOne(testUser)

		res.json({
			success: true,
			message: 'Test user created successfully',
			data: testUser,
		})
	} catch (error) {
		console.error('Error creating test user:', error)
		res.status(500).json({
			success: false,
			error: 'Failed to create test user',
		})
	}
})

module.exports = router
