import { create } from 'zustand'

const API = '/api'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const json = await res.json()
  return json.success ? json.data : json
}

function toService(row: Record<string, unknown>): Service {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    category: (row.category as Service['category']) ?? 'portrait',
    duration: Number(row.duration ?? 0),
    basePrice: Number(row.base_price ?? row.basePrice ?? 0),
    depositRate: Number(row.deposit_rate ?? row.depositRate ?? 0.3),
    includedItems: Array.isArray(row.included_items)
      ? row.included_items as string[]
      : typeof row.included_items === 'string'
      ? JSON.parse(row.included_items || '[]')
      : (row.includedItems as string[]) ?? [],
    description: String(row.description ?? ''),
    imageUrl: String(row.image_url ?? row.imageUrl ?? ''),
    isActive: Boolean(row.is_active ?? row.isActive ?? true),
    createdAt: String(row.created_at ?? row.createdAt ?? ''),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? ''),
  }
}

function toServicePayload(s: Partial<Service>) {
  return {
    name: s.name,
    category: s.category,
    duration: s.duration,
    basePrice: s.basePrice,
    depositRate: s.depositRate,
    includedItems: s.includedItems,
    description: s.description,
    imageUrl: s.imageUrl,
    isActive: s.isActive,
  }
}

function toBooking(row: Record<string, unknown>): Booking {
  return {
    id: Number(row.id),
    serviceId: Number(row.service_id ?? row.serviceId ?? 0),
    customerId: Number(row.customer_id ?? row.customerId ?? 0),
    photographerId: row.photographer_id ? Number(row.photographer_id) : row.photographerId ? Number(row.photographerId) : undefined,
    serviceName: String(row.service_name ?? ''),
    serviceCategory: row.service_category ? String(row.service_category) : undefined,
    basePrice: row.base_price !== undefined ? Number(row.base_price) : undefined,
    customerName: String(row.customer_name ?? ''),
    customerPhone: row.customer_phone ? String(row.customer_phone) : undefined,
    customerEmail: row.customer_email ? String(row.customer_email) : undefined,
    date: String(row.date ?? ''),
    timeSlot: String(row.time_slot ?? row.timeSlot ?? ''),
    status: (row.status as Booking['status']) ?? 'pending',
    depositPaid: Boolean(row.deposit_paid ?? row.depositPaid ?? false),
    depositAmount: Number(row.deposit_amount ?? row.depositAmount ?? 0),
    totalPrice: Number(row.total_price ?? row.totalPrice ?? 0),
    priceMultiplier: Number(row.price_multiplier ?? row.priceMultiplier ?? 1.0),
    notes: String(row.notes ?? ''),
    createdAt: String(row.created_at ?? row.createdAt ?? ''),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? ''),
  }
}

function toPhoto(row: Record<string, unknown>): Photo {
  return {
    id: Number(row.id),
    albumId: Number(row.album_id ?? row.albumId ?? 0),
    url: String(row.url ?? ''),
    thumbnailUrl: String(row.thumbnail_url ?? row.thumbnailUrl ?? ''),
    isSelected: Boolean(row.is_selected ?? row.isSelected ?? false),
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
    uploadedAt: String(row.uploaded_at ?? row.uploadedAt ?? ''),
  }
}

function toAlbum(row: Record<string, unknown>): Album {
  const photos = Array.isArray(row.photos) ? (row.photos as Record<string, unknown>[]).map(toPhoto) : []
  return {
    id: Number(row.id),
    bookingId: Number(row.booking_id ?? row.bookingId ?? 0),
    accessKey: String(row.access_key ?? row.accessKey ?? ''),
    title: String(row.title ?? ''),
    photos,
    selectedCount: photos.filter(p => p.isSelected).length,
    totalPhotos: photos.length,
  }
}

function toReview(row: Record<string, unknown>): Review {
  return {
    id: Number(row.id),
    bookingId: Number(row.booking_id ?? row.bookingId ?? 0),
    customerId: Number(row.customer_id ?? row.customerId ?? 0),
    customerName: String(row.customer_name ?? ''),
    rating: Number(row.rating ?? 0),
    content: String(row.content ?? ''),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : [],
    isFeatured: Boolean(row.is_featured ?? row.isFeatured ?? false),
    createdAt: String(row.created_at ?? row.createdAt ?? ''),
  }
}

function toSchedule(row: Record<string, unknown>): ScheduleConfig {
  return {
    date: String(row.date ?? ''),
    isAvailable: Boolean(row.is_available ?? row.isAvailable ?? true),
    priceMultiplier: Number(row.price_multiplier ?? row.priceMultiplier ?? 1.0),
    isHoliday: Boolean(row.is_holiday ?? row.isHoliday ?? false),
    seasonType: (row.season_type as ScheduleConfig['seasonType']) ?? (row.seasonType as ScheduleConfig['seasonType']) ?? 'normal',
    timeSlots: [],
  }
}

function toHoliday(row: Record<string, unknown>): Holiday {
  return {
    id: Number(row.id),
    date: String(row.date ?? ''),
    name: String(row.name ?? ''),
    priceMultiplier: Number(row.price_multiplier ?? row.priceMultiplier ?? 1.0),
  }
}

function toSeasonPricing(row: Record<string, unknown>): SeasonPricing {
  return {
    seasonType: (row.season_type as SeasonPricing['seasonType']) ?? (row.seasonType as SeasonPricing['seasonType']) ?? 'normal',
    serviceId: Number(row.service_id ?? row.serviceId ?? 0),
    multiplier: Number(row.multiplier ?? 1.0),
  }
}

export interface Service {
  id: number
  name: string
  category: 'id_photo' | 'portrait' | 'commercial' | 'wedding'
  duration: number
  basePrice: number
  depositRate: number
  includedItems: string[]
  description: string
  imageUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Booking {
  id: number
  serviceId: number
  customerId: number
  photographerId?: number
  serviceName?: string
  serviceCategory?: string
  basePrice?: number
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  date: string
  timeSlot: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  depositPaid: boolean
  depositAmount: number
  totalPrice: number
  priceMultiplier: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface TimeSlotConfig {
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface Photo {
  id: number
  albumId: number
  url: string
  thumbnailUrl: string
  isSelected: boolean
  sortOrder: number
  uploadedAt: string
}

export interface Album {
  id: number
  bookingId: number
  accessKey: string
  title: string
  photos: Photo[]
  selectedCount: number
  totalPhotos: number
}

export interface ShootingRecord {
  bookingId: number
  serviceType: string
  date: string
  photoCount: number
  selectedCount: number
}

export interface PhotographerNote {
  id: number
  photographerId: number
  photographerName?: string
  content: string
  createdAt: string
}

export interface CustomerProfile {
  id: number
  name: string
  phone: string
  email: string
  stylePreferences: string[]
  bookings: Booking[]
  shootingHistory: ShootingRecord[]
  photographerNotes: PhotographerNote[]
}

export interface Review {
  id: number
  bookingId: number
  customerId: number
  customerName?: string
  rating: number
  content: string
  tags: string[]
  isFeatured: boolean
  createdAt: string
}

export interface ScheduleConfig {
  date: string
  isAvailable: boolean
  priceMultiplier: number
  isHoliday: boolean
  seasonType: 'peak' | 'off_peak' | 'normal'
  timeSlots: TimeSlotConfig[]
}

export interface SeasonPricing {
  seasonType: 'peak' | 'off_peak' | 'normal'
  serviceId: number
  multiplier: number
}

export interface Holiday {
  id: number
  date: string
  name: string
  priceMultiplier: number
}

export interface Stats {
  todayBookings: number
  monthlyRevenue: number
  pendingSelections: number
  reviewRate: number
  goodReviewRate?: number
  monthRevenue?: number
}

interface ServiceState {
  services: Service[]
  loading: boolean
  error: string | null
  fetchServices: () => Promise<void>
  createService: (data: Partial<Service>) => Promise<Service>
  updateService: (id: number, data: Partial<Service>) => Promise<Service>
  deleteService: (id: number) => Promise<void>
}

export const useServiceStore = create<ServiceState>((set) => ({
  services: [],
  loading: false,
  error: null,
  fetchServices: async () => {
    set({ loading: true })
    try {
      const data = await apiFetch<Record<string, unknown>[]>('/api/services')
      set({ services: data.map(toService), loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  createService: async (data) => {
    const raw = await apiFetch<Record<string, unknown>>('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toServicePayload(data)),
    })
    const svc = toService(raw)
    set((s) => ({ services: [...s.services, svc] }))
    return svc
  },
  updateService: async (id, data) => {
    const raw = await apiFetch<Record<string, unknown>>(`/api/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toServicePayload(data)),
    })
    const svc = toService(raw)
    set((s) => ({ services: s.services.map((svc2) => (svc2.id === id ? svc : svc2)) }))
    return svc
  },
  deleteService: async (id) => {
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
    set((s) => ({ services: s.services.filter((svc) => svc.id !== id) }))
  },
}))

interface BookingState {
  bookings: Booking[]
  loading: boolean
  error: string | null
  currentCustomerId: number | null
  fetchBookings: () => Promise<void>
  fetchCustomerBookings: (id: number) => Promise<void>
  fetchAvailableSlots: (date: string) => Promise<TimeSlotConfig[]>
  createBooking: (data: {
    serviceId: number
    date: string
    timeSlot: string
    notes: string
    customerName: string
    customerPhone: string
    customerEmail: string
  }) => Promise<{ booking: Booking | null; error?: string }>
  updateBookingStatus: (id: number, status: Booking['status']) => Promise<void>
}

const getInitialCustomerId = (): number | null => {
  try {
    const stored = localStorage.getItem('currentCustomerId')
    return stored ? Number(stored) : null
  } catch {
    return null
  }
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  loading: false,
  error: null,
  currentCustomerId: getInitialCustomerId(),
  fetchBookings: async () => {
    set({ loading: true })
    try {
      const data = await apiFetch<Record<string, unknown>[]>('/api/bookings')
      set({ bookings: data.map(toBooking), loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  fetchCustomerBookings: async (id) => {
    set({ loading: true })
    try {
      const data = await apiFetch<Record<string, unknown>[]>(`/api/bookings/customer/${id}`)
      set({ bookings: data.map(toBooking), loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  fetchAvailableSlots: async (date) => {
    try {
      const raw = await apiFetch<string[]>(`/api/bookings/available-slots/list?date=${date}`)
      return raw.map((t) => {
        const h = Number(t.split(':')[0])
        return { startTime: t, endTime: `${String(h + 1).padStart(2, '0')}:00`, isAvailable: true }
      })
    } catch {
      return []
    }
  },
  createBooking: async (data) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        return { booking: null, error: json.error || '预约失败' }
      }
      const booking = toBooking(json.data)
      try {
        localStorage.setItem('currentCustomerId', String(booking.customerId))
      } catch {}
      set((s) => ({
        bookings: [...s.bookings, booking],
        currentCustomerId: booking.customerId,
      }))
      return { booking, error: undefined }
    } catch (e: any) {
      return { booking: null, error: e.message || '网络错误' }
    }
  },
  updateBookingStatus: async (id, status) => {
    const raw = await apiFetch<Record<string, unknown>>(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const updated = toBooking(raw)
    set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...updated } : b)) }))
  },
}))

interface AlbumState {
  album: Album | null
  loading: boolean
  error: string | null
  fetchAlbum: (accessKey: string) => Promise<void>
  selectPhotos: (albumId: number, photoIds: number[], selected: boolean) => Promise<void>
}

export const useAlbumStore = create<AlbumState>((set) => ({
  album: null,
  loading: false,
  error: null,
  fetchAlbum: async (accessKey) => {
    set({ loading: true })
    try {
      const data = await apiFetch<Record<string, unknown>>(`/api/albums/${accessKey}`)
      set({ album: toAlbum(data), loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  selectPhotos: async (albumId, photoIds, selected) => {
    await fetch(`/api/albums/${albumId}/photos/select`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoIds, selected }),
    })
    set((s) => {
      if (!s.album) return s
      const photos = s.album.photos.map((p) =>
        photoIds.includes(p.id) ? { ...p, isSelected: selected } : p
      )
      return {
        album: {
          ...s.album,
          photos,
          selectedCount: photos.filter(p => p.isSelected).length,
        },
      }
    })
  },
}))

interface CustomerState {
  profile: CustomerProfile | null
  loading: boolean
  error: string | null
  fetchProfile: (id: number) => Promise<void>
  updatePreferences: (id: number, prefs: string[]) => Promise<void>
  addNote: (id: number, photographerId: number, content: string) => Promise<void>
}

function toCustomerProfile(row: Record<string, unknown>): CustomerProfile {
  const stylePrefs = Array.isArray(row.style_preferences)
    ? (row.style_preferences as string[])
    : typeof row.style_preferences === 'string'
    ? JSON.parse(row.style_preferences || '[]')
    : (row.stylePreferences as string[]) ?? []
  const rawBookings = Array.isArray(row.bookings)
    ? (row.bookings as Record<string, unknown>[])
    : []
  const bookings = rawBookings.map(toBooking)
  const notesRaw = Array.isArray(row.photographerNotes)
    ? row.photographerNotes
    : Array.isArray(row.photographer_notes)
    ? row.photographer_notes
    : []
  const photographerNotes: PhotographerNote[] = (notesRaw as Record<string, unknown>[]).map(n => ({
    id: Number(n.id),
    photographerId: Number(n.photographer_id ?? n.photographerId ?? 0),
    photographerName: String(n.photographer_name ?? ''),
    content: String(n.content ?? ''),
    createdAt: String(n.created_at ?? n.createdAt ?? ''),
  }))
  const shootingHistory: ShootingRecord[] = rawBookings.map((raw, idx) => {
    const b = bookings[idx]
    return {
      bookingId: b.id,
      serviceType: b.serviceName || '',
      date: b.date,
      photoCount: Number(raw.total_photos ?? 0),
      selectedCount: Number(raw.selected_photos ?? 0),
    }
  })
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    stylePreferences: stylePrefs,
    bookings,
    shootingHistory,
    photographerNotes,
  }
}

export const useCustomerStore = create<CustomerState>((set) => ({
  profile: null,
  loading: false,
  error: null,
  fetchProfile: async (id) => {
    set({ loading: true })
    try {
      const data = await apiFetch<Record<string, unknown>>(`/api/customers/${id}/profile`)
      set({ profile: toCustomerProfile(data), loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  updatePreferences: async (id, prefs) => {
    await fetch(`/api/customers/${id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stylePreferences: prefs }),
    })
    set((s) => ({
      profile: s.profile ? { ...s.profile, stylePreferences: prefs } : s.profile,
    }))
  },
  addNote: async (id, photographerId, content) => {
    await fetch(`/api/customers/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photographerId, content }),
    })
  },
}))

interface ReviewState {
  reviews: Review[]
  featuredReviews: Review[]
  loading: boolean
  error: string | null
  fetchFeatured: () => Promise<void>
  fetchByService: (serviceId: number) => Promise<void>
  submitReview: (data: Partial<Review> & { bookingId: number; customerId: number; rating: number }) => Promise<void>
}

export const useReviewStore = create<ReviewState>((set) => ({
  reviews: [],
  featuredReviews: [],
  loading: false,
  error: null,
  fetchFeatured: async () => {
    set({ loading: true })
    try {
      const data = await apiFetch<Record<string, unknown>[]>('/api/reviews/featured')
      set({ featuredReviews: data.map(toReview), loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  fetchByService: async (serviceId) => {
    set({ loading: true })
    try {
      const data = await apiFetch<Record<string, unknown>[]>(`/api/reviews/service/${serviceId}`)
      set({ reviews: data.map(toReview), loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  submitReview: async (data) => {
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },
}))

interface ScheduleState {
  schedules: ScheduleConfig[]
  holidays: Holiday[]
  seasonPricing: SeasonPricing[]
  loading: boolean
  error: string | null
  fetchSchedules: (month: string) => Promise<void>
  updateSchedule: (date: string, data: Partial<ScheduleConfig>) => Promise<void>
  fetchHolidays: () => Promise<void>
  addHoliday: (data: Partial<Holiday> & { date: string; name: string }) => Promise<void>
  deleteHoliday: (id: number) => Promise<void>
  fetchSeasonPricing: () => Promise<void>
  updateSeasonPricing: (data: SeasonPricing[]) => Promise<void>
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  schedules: [],
  holidays: [],
  seasonPricing: [],
  loading: false,
  error: null,
  fetchSchedules: async (month) => {
    set({ loading: true })
    try {
      const data = await apiFetch<Record<string, unknown>[]>(`/api/schedule?month=${month}`)
      set({ schedules: data.map(toSchedule), loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  updateSchedule: async (date, data) => {
    await apiFetch(`/api/schedule/${date}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isAvailable: data.isAvailable,
        priceMultiplier: data.priceMultiplier,
        isHoliday: data.isHoliday,
        seasonType: data.seasonType,
      }),
    })
    set((s) => ({
      schedules: s.schedules.map((sc) => (sc.date === date ? { ...sc, ...data } : sc)),
    }))
  },
  fetchHolidays: async () => {
    try {
      const data = await apiFetch<Record<string, unknown>[]>('/api/schedule/pricing/holidays')
      set({ holidays: data.map(toHoliday) })
    } catch (e: any) {
      set({ error: e.message })
    }
  },
  addHoliday: async (data) => {
    const raw = await apiFetch<Record<string, unknown>>('/api/schedule/pricing/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    set((s) => ({ holidays: [...s.holidays, toHoliday(raw)] }))
  },
  deleteHoliday: async (id) => {
    await fetch(`/api/schedule/pricing/holidays/${id}`, { method: 'DELETE' })
    set((s) => ({ holidays: s.holidays.filter((h) => h.id !== id) }))
  },
  fetchSeasonPricing: async () => {
    try {
      const data = await apiFetch<Record<string, unknown>[]>('/api/schedule/pricing/seasons')
      set({ seasonPricing: data.map(toSeasonPricing) })
    } catch (e: any) {
      set({ error: e.message })
    }
  },
  updateSeasonPricing: async (data) => {
    await apiFetch('/api/schedule/pricing/seasons', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    set({ seasonPricing: data })
  },
}))

interface StatsState {
  stats: Stats | null
  loading: boolean
  error: string | null
  fetchStats: () => Promise<void>
}

function toStats(row: Record<string, unknown>): Stats {
  return {
    todayBookings: Number(row.todayBookings ?? row.today_bookings ?? 0),
    monthlyRevenue: Number(row.monthlyRevenue ?? row.month_revenue ?? row.monthRevenue ?? 0),
    pendingSelections: Number(row.pendingSelections ?? row.pending_selections ?? 0),
    reviewRate: Number(row.reviewRate ?? row.goodReviewRate ?? row.good_review_rate ?? 0),
    goodReviewRate: Number(row.goodReviewRate ?? row.good_review_rate ?? 0),
    monthRevenue: Number(row.monthRevenue ?? row.month_revenue ?? 0),
  }
}

export const useStatsStore = create<StatsState>((set) => ({
  stats: null,
  loading: false,
  error: null,
  fetchStats: async () => {
    set({ loading: true })
    try {
      const data = await apiFetch<Record<string, unknown>>('/api/stats')
      set({ stats: toStats(data), loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
}))

export { API }
