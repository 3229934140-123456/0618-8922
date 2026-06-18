import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`

    const todayBookings = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE date = ?').get(today) as Record<string, unknown>

    const monthRevenue = db.prepare(`
      SELECT COALESCE(SUM(total_price), 0) as total
      FROM bookings
      WHERE date >= ? AND status IN ('confirmed', 'completed')
    `).get(monthStart) as Record<string, unknown>

    const pendingSelections = db.prepare(`
      SELECT COUNT(*) as count FROM albums a
      WHERE EXISTS (SELECT 1 FROM photos p WHERE p.album_id = a.id AND p.is_selected = 0)
      AND EXISTS (SELECT 1 FROM photos p WHERE p.album_id = a.id AND p.is_selected = 1)
    `).get() as Record<string, unknown>

    const reviewStats = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as good FROM reviews').get() as Record<string, unknown>
    const total = Number(reviewStats?.total ?? 0)
    const good = Number(reviewStats?.good ?? 0)
    const goodReviewRate = total > 0 ? Math.round((good / total) * 100) : 0

    res.json({
      success: true,
      data: {
        todayBookings: Number(todayBookings?.count ?? 0),
        monthRevenue: Number(monthRevenue?.total ?? 0),
        pendingSelections: Number(pendingSelections?.count ?? 0),
        goodReviewRate,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
})

export default router
