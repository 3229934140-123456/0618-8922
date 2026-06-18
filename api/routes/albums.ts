import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import { getDb } from '../db.js'

const router = Router()

router.get('/:accessKey', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const album = db.prepare('SELECT * FROM albums WHERE access_key = ?').get(req.params.accessKey) as Record<string, unknown> | undefined
    if (!album) {
      res.status(404).json({ success: false, error: 'Album not found' })
      return
    }
    const photos = db.prepare('SELECT * FROM photos WHERE album_id = ? ORDER BY sort_order ASC, uploaded_at ASC').all(album.id)
    res.json({ success: true, data: { ...album, photos } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch album' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { bookingId, title } = req.body
    const booking = db.prepare('SELECT id FROM bookings WHERE id = ?').get(bookingId)
    if (!booking) {
      res.status(400).json({ success: false, error: 'Booking not found' })
      return
    }
    const accessKey = crypto.randomBytes(8).toString('hex')
    const result = db.prepare('INSERT INTO albums (booking_id, access_key, title) VALUES (?, ?, ?)').run(bookingId, accessKey, title)
    const album = db.prepare('SELECT * FROM albums WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: album })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create album' })
  }
})

router.post('/:id/photos', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const album = db.prepare('SELECT id FROM albums WHERE id = ?').get(req.params.id)
    if (!album) {
      res.status(404).json({ success: false, error: 'Album not found' })
      return
    }
    const { url, thumbnailUrl } = req.body
    const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) as max_order FROM photos WHERE album_id = ?').get(req.params.id) as { max_order: number }
    const result = db.prepare('INSERT INTO photos (album_id, url, thumbnail_url, sort_order) VALUES (?, ?, ?, ?)').run(Number(req.params.id), url, thumbnailUrl ?? null, maxOrder.max_order + 1)
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: photo })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add photo' })
  }
})

router.put('/:id/photos/select', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { photoIds, selected } = req.body
    if (!Array.isArray(photoIds) || typeof selected !== 'boolean') {
      res.status(400).json({ success: false, error: 'photoIds array and selected boolean are required' })
      return
    }
    const updateMany = db.transaction((ids: number[]) => {
      for (const id of ids) {
        db.prepare('UPDATE photos SET is_selected = ? WHERE id = ? AND album_id = ?').run(selected ? 1 : 0, id, Number(req.params.id))
      }
    })
    updateMany(photoIds)
    res.json({ success: true, data: { updated: photoIds.length } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update photo selection' })
  }
})

router.get('/:id/selection-summary', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const album = db.prepare('SELECT id FROM albums WHERE id = ?').get(req.params.id)
    if (!album) {
      res.status(404).json({ success: false, error: 'Album not found' })
      return
    }
    const summary = db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN is_selected = 1 THEN 1 ELSE 0 END) as selected_count
      FROM photos WHERE album_id = ?
    `).get(req.params.id) as { total: number; selected_count: number }
    res.json({ success: true, data: { total: summary.total, selectedCount: summary.selected_count } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get selection summary' })
  }
})

export default router
