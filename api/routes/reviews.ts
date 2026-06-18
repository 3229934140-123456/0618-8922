import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

function parseReview(row: Record<string, unknown>) {
  if (!row) return row
  return { ...row, tags: JSON.parse((row.tags as string) || '[]') }
}

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { bookingId, customerId, rating, content, tags } = req.body
    const result = db.prepare('INSERT INTO reviews (booking_id, customer_id, rating, content, tags) VALUES (?, ?, ?, ?, ?)').run(
      bookingId,
      customerId,
      rating,
      content ?? null,
      JSON.stringify(tags ?? []),
    )
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>
    res.status(201).json({ success: true, data: parseReview(review) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create review' })
  }
})

router.get('/featured', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rows = db.prepare(`
      SELECT r.*, c.name as customer_name, s.name as service_name
      FROM reviews r
      JOIN customers c ON r.customer_id = c.id
      JOIN bookings b ON r.booking_id = b.id
      JOIN services s ON b.service_id = s.id
      WHERE r.rating >= 4 AND r.is_featured = 1
      ORDER BY r.created_at DESC
    `).all() as Record<string, unknown>[]
    res.json({ success: true, data: rows.map(parseReview) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch featured reviews' })
  }
})

router.get('/service/:serviceId', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rows = db.prepare(`
      SELECT r.*, c.name as customer_name
      FROM reviews r
      JOIN customers c ON r.customer_id = c.id
      JOIN bookings b ON r.booking_id = b.id
      WHERE b.service_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.serviceId) as Record<string, unknown>[]
    res.json({ success: true, data: rows.map(parseReview) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch service reviews' })
  }
})

router.put('/:id/feature', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const review = db.prepare('SELECT is_featured FROM reviews WHERE id = ?').get(req.params.id) as { is_featured: number } | undefined
    if (!review) {
      res.status(404).json({ success: false, error: 'Review not found' })
      return
    }
    const newFeatured = review.is_featured ? 0 : 1
    db.prepare('UPDATE reviews SET is_featured = ? WHERE id = ?').run(newFeatured, req.params.id)
    const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id) as Record<string, unknown>
    res.json({ success: true, data: parseReview(updated) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to toggle featured status' })
  }
})

export default router
