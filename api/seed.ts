import { getDb } from './db.js'

export function seedDatabase(): void {
  const db = getDb()

  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get() as Record<string, unknown>
  if ((serviceCount?.count as number) > 0) return

  const insertService = db.prepare(`
    INSERT INTO services (name, category, duration, base_price, deposit_rate, included_items, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const services = [
    { name: '证件照', category: 'id_photo', duration: 30, base_price: 199, deposit_rate: 0.3, included_items: '["精修1张","底片3张","多种底色"]', description: '专业证件照拍摄，含精修和多张底片' },
    { name: '个人写真', category: 'portrait', duration: 120, base_price: 1299, deposit_rate: 0.3, included_items: '["精修10张","底片50张","造型2套","室内+室外"]', description: '个人艺术写真，含多套造型和精修交付' },
    { name: '商业产品拍摄', category: 'commercial', duration: 180, base_price: 2999, deposit_rate: 0.4, included_items: '["精修20张","场景3组","后期精调","PNG透明底"]', description: '商业产品专业拍摄，多场景多角度精修' },
    { name: '婚纱预拍', category: 'wedding', duration: 480, base_price: 5999, deposit_rate: 0.5, included_items: '["精修30张","底片全送","造型3套","外景1处","相册1本"]', description: '婚纱摄影全包套餐，含内外景和全套造型' },
  ]

  const serviceIds: number[] = []
  for (const s of services) {
    const result = insertService.run(s.name, s.category, s.duration, s.base_price, s.deposit_rate, s.included_items, s.description)
    serviceIds.push(Number(result.lastInsertRowid))
  }

  const insertCustomer = db.prepare('INSERT INTO customers (name, phone, email, style_preferences) VALUES (?, ?, ?, ?)')
  const customerIds: number[] = []
  const customers = [
    { name: '张小明', phone: '13800138001', email: 'zhangxm@example.com', style_preferences: '["清新","自然风","简约风"]' },
    { name: '李美丽', phone: '13800138002', email: 'liml@example.com', style_preferences: '["复古风","文艺风","胶片风"]' },
    { name: '王大伟', phone: '13800138003', email: 'wangdw@example.com', style_preferences: '["简约风","时尚风","暗调风"]' },
  ]
  for (const c of customers) {
    const result = insertCustomer.run(c.name, c.phone, c.email, c.style_preferences)
    customerIds.push(Number(result.lastInsertRowid))
  }

  const photographerId = 1

  const insertNote = db.prepare('INSERT INTO photographer_notes (customer_id, photographer_id, content) VALUES (?, ?, ?)')
  insertNote.run(customerIds[0], photographerId, '喜欢自然光线，笑容自然，正面角度最佳')
  insertNote.run(customerIds[1], photographerId, '适合侧逆光，表情沉静，复古色调偏好')
  insertNote.run(customerIds[2], photographerId, '商务风格，深色背景，着装正式')

  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const insertBooking = db.prepare(`
    INSERT INTO bookings (service_id, customer_id, photographer_id, date, time_slot, status, deposit_paid, deposit_amount, total_price, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const bookingIds: number[] = []
  const bookings = [
    { serviceId: serviceIds[0], customerId: customerIds[0], photographerId, date: today, timeSlot: '09:00', status: 'confirmed', depositPaid: 1, depositAmount: 59.7, totalPrice: 199, notes: '需要蓝底和白底各一张' },
    { serviceId: serviceIds[1], customerId: customerIds[1], photographerId, date: tomorrow, timeSlot: '10:00', status: 'pending', depositPaid: 0, depositAmount: 389.7, totalPrice: 1299, notes: '希望户外拍摄，公园场景' },
    { serviceId: serviceIds[3], customerId: customerIds[2], photographerId, date: yesterday, timeSlot: '14:00', status: 'completed', depositPaid: 1, depositAmount: 2999.5, totalPrice: 5999, notes: '提前半小时到化妆' },
  ]
  for (const b of bookings) {
    const result = insertBooking.run(b.serviceId, b.customerId, b.photographerId, b.date, b.timeSlot, b.status, b.depositPaid, b.depositAmount, b.totalPrice, b.notes)
    bookingIds.push(Number(result.lastInsertRowid))
  }

  const insertAlbum = db.prepare('INSERT INTO albums (booking_id, access_key, title) VALUES (?, ?, ?)')
  const thirdBookingId = bookingIds[2]
  const albumResult = insertAlbum.run(thirdBookingId, `booking-${thirdBookingId}`, '王大伟 婚纱预拍 精修片')
  const albumId = Number(albumResult.lastInsertRowid)

  const insertPhoto = db.prepare('INSERT INTO photos (album_id, url, thumbnail_url, is_selected, sort_order) VALUES (?, ?, ?, ?, ?)')
  const imagePrompts = [
    'elegant wedding portrait couple standing golden hour sunset field romantic',
    'bride groom holding hands walking garden flowers happy smile',
    'classic wedding portrait studio lighting black tuxedo white dress',
    'couple dancing first dance elegant ballroom bokeh',
    'wedding close up portrait loving eyes forehead touch',
    'groom lifting bride celebration confetti happiness',
    'wedding rings detail shot elegant dark velvet surface',
    'bride portrait veil natural light window dreamy',
  ]
  const promptEncoded = imagePrompts.map(p => encodeURIComponent(p))
  for (let i = 0; i < promptEncoded.length; i++) {
    const url = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20photography%20${promptEncoded[i]}&image_size=portrait_4_3`
    const isSel = i < 5 ? 1 : 0
    insertPhoto.run(albumId, url, url, isSel, i + 1)
  }

  const insertReview = db.prepare('INSERT INTO reviews (booking_id, customer_id, rating, content, tags, is_featured) VALUES (?, ?, ?, ?, ?, ?)')
  insertReview.run(bookingIds[2], customerIds[2], 5, '非常满意！照片效果超赞，摄影师很专业，全程沟通顺畅。', '["专业","满意","出片快"]', 1)
  insertReview.run(bookingIds[0], customerIds[0], 4, '证件照拍得不错，效率很高，修图也很自然，很快就拿到了成品。', '["高效","清晰","服务好"]', 1)

  const insertHoliday = db.prepare('INSERT INTO holidays (date, name, price_multiplier) VALUES (?, ?, ?)')
  const year = new Date().getFullYear()
  insertHoliday.run(`${year}-01-01`, '元旦', 1.2)
  insertHoliday.run(`${year}-02-14`, '情人节', 1.3)
  insertHoliday.run(`${year}-05-01`, '劳动节', 1.2)
  insertHoliday.run(`${year}-10-01`, '国庆节', 1.2)
  insertHoliday.run(`${year}-10-02`, '国庆节', 1.2)
  insertHoliday.run(`${year}-10-03`, '国庆节', 1.2)
  insertHoliday.run(`${year}-12-25`, '圣诞节', 1.15)

  const insertSeason = db.prepare('INSERT INTO season_pricing (season_type, service_id, multiplier) VALUES (?, ?, ?)')
  for (const sid of serviceIds) {
    insertSeason.run('peak', sid, 1.25)
    insertSeason.run('off_peak', sid, 0.85)
    insertSeason.run('normal', sid, 1.0)
  }

  db.save()
  console.log('Database seeded successfully')
}
