import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rows = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all() as Record<string, unknown>[]
    for (const row of rows) {
      row.style_preferences = JSON.parse((row.style_preferences as string) || '[]')
    }
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch customers' })
  }
})

router.get('/:id/profile', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' })
      return
    }
    customer.style_preferences = JSON.parse((customer.style_preferences as string) || '[]')

    const bookings = db.prepare(`
      SELECT b.*, s.name as service_name, s.category as service_category
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.customer_id = ?
      ORDER BY b.date DESC
    `).all(req.params.id)

    const notes = db.prepare(`
      SELECT pn.*, c.name as photographer_name
      FROM photographer_notes pn
      JOIN customers c ON pn.photographer_id = c.id
      WHERE pn.customer_id = ?
      ORDER BY pn.created_at DESC
    `).all(req.params.id)

    res.json({ success: true, data: { ...customer, bookings, photographerNotes: notes } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch customer profile' })
  }
})

router.put('/:id/profile', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { stylePreferences } = req.body
    db.prepare("UPDATE customers SET style_preferences = ?, updated_at = datetime('now') WHERE id = ?").run(
      JSON.stringify(stylePreferences ?? []),
      req.params.id,
    )
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id) as Record<string, unknown>
    customer.style_preferences = JSON.parse((customer.style_preferences as string) || '[]')
    res.json({ success: true, data: customer })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update customer profile' })
  }
})

router.post('/:id/notes', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { photographerId, content } = req.body
    const result = db.prepare('INSERT INTO photographer_notes (customer_id, photographer_id, content) VALUES (?, ?, ?)').run(Number(req.params.id), photographerId, content)
    const note = db.prepare('SELECT * FROM photographer_notes WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: note })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add photographer note' })
  }
})

export default router
