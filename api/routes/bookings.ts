import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status, date } = req.query
    let sql = `
      SELECT b.*, s.name as service_name, s.category as service_category, s.base_price,
             c.name as customer_name, c.phone as customer_phone, c.email as customer_email
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN customers c ON b.customer_id = c.id
      WHERE 1=1
    `
    const params: unknown[] = []
    if (status) {
      sql += ' AND b.status = ?'
      params.push(status)
    }
    if (date) {
      sql += ' AND b.date = ?'
      params.push(date)
    }
    sql += ' ORDER BY b.date DESC, b.time_slot ASC'
    const rows = db.prepare(sql).all(...params)
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const row = db.prepare(`
      SELECT b.*, s.name as service_name, s.category as service_category, s.base_price, s.duration,
             c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
             c.style_preferences as customer_style_preferences
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
    `).get(req.params.id) as Record<string, unknown> | undefined
    if (!row) {
      res.status(404).json({ success: false, error: 'Booking not found' })
      return
    }
    row.customer_style_preferences = JSON.parse((row.customer_style_preferences as string) || '[]')
    res.json({ success: true, data: row })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch booking' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { serviceId, customerName, customerPhone, customerEmail, date, timeSlot, notes } = req.body

    let customerId: number
    const existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(customerPhone) as { id: number } | undefined
    if (existing) {
      customerId = existing.id
    } else {
      const custResult = db.prepare('INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)').run(customerName, customerPhone ?? null, customerEmail ?? null)
      customerId = Number(custResult.lastInsertRowid)
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId) as Record<string, unknown> | undefined
    if (!service) {
      res.status(400).json({ success: false, error: 'Service not found' })
      return
    }

    let multiplier = 1.0
    const holiday = db.prepare('SELECT price_multiplier FROM holidays WHERE date = ?').get(date) as { price_multiplier: number } | undefined
    if (holiday) {
      multiplier = holiday.price_multiplier
    } else {
      const schedule = db.prepare('SELECT price_multiplier FROM schedule_configs WHERE date = ?').get(date) as { price_multiplier: number } | undefined
      if (schedule && schedule.price_multiplier) {
        multiplier = schedule.price_multiplier
      }
    }

    const basePrice = service.base_price as number
    const depositRate = service.deposit_rate as number
    const totalPrice = Math.round(basePrice * multiplier * 100) / 100
    const depositAmount = Math.round(totalPrice * depositRate * 100) / 100

    const result = db.prepare(`
      INSERT INTO bookings (service_id, customer_id, date, time_slot, deposit_amount, total_price, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(serviceId, customerId, date, timeSlot, depositAmount, totalPrice, notes ?? null)

    const booking = db.prepare(`
      SELECT b.*, s.name as service_name, c.name as customer_name, c.phone as customer_phone
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: booking })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create booking' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!existing) {
      res.status(404).json({ success: false, error: 'Booking not found' })
      return
    }
    const { status, depositPaid, photographerId } = req.body
    db.prepare(`
      UPDATE bookings SET
        status = COALESCE(?, status),
        deposit_paid = COALESCE(?, deposit_paid),
        photographer_id = COALESCE(?, photographer_id),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(status ?? null, depositPaid ?? null, photographerId ?? null, req.params.id)
    const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update booking' })
  }
})

router.get('/available-slots/list', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { date } = req.query
    if (!date) {
      res.status(400).json({ success: false, error: 'Date parameter is required' })
      return
    }

    const schedule = db.prepare('SELECT is_available FROM schedule_configs WHERE date = ?').get(date) as { is_available: number } | undefined
    if (schedule && !schedule.is_available) {
      res.json({ success: true, data: [] })
      return
    }

    const allSlots: string[] = []
    for (let h = 9; h < 18; h++) {
      allSlots.push(`${h.toString().padStart(2, '0')}:00`)
    }

    const booked = db.prepare("SELECT time_slot FROM bookings WHERE date = ? AND status != 'cancelled'").all(date) as { time_slot: string }[]
    const bookedSlots = new Set(booked.map(b => b.time_slot))
    const available = allSlots.filter(s => !bookedSlots.has(s))

    res.json({ success: true, data: available })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch available slots' })
  }
})

export default router
