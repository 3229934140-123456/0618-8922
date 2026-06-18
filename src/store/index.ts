import { create } from 'zustand'

const API = '/api'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const json = await res.json()
  return json.success ? json.data : json
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
  customerName?: string
  date: string
  timeSlot: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  depositPaid: boolean
  depositAmount: number
  totalPrice: number
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
  content: string
  createdAt: string
}

export interface CustomerProfile {
  id: number
  name: string
  phone: string
  email: string
  stylePreferences: string[]
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
}

interface ServiceState {
  services: Service[]
  loading: boolean
  error: string | null
  fetchServices: () => Promise<void>
  createService: (data: Partial<Service>) => Promise<void>
  updateService: (id: number, data: Partial<Service>) => Promise<void>
  deleteService: (id: number) => Promise<void>
}

export const useServiceStore = create<ServiceState>((set) => ({
  services: [],
  loading: false,
  error: null,
  fetchServices: async () => {
    set({ loading: true })
    try {
      const data = await apiFetch<Service[]>('/api/services')
      set({ services: data, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  createService: async (data) => {
    const item = await apiFetch<Service>('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    set((s) => ({ services: [...s.services, item] }))
  },
  updateService: async (id, data) => {
    const updated = await apiFetch<Service>(`/api/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    set((s) => ({ services: s.services.map((svc) => (svc.id === id ? updated : svc)) }))
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
  fetchBookings: () => Promise<void>
  fetchCustomerBookings: (id: number) => Promise<void>
  fetchAvailableSlots: (date: string) => Promise<TimeSlotConfig[]>
  createBooking: (data: Partial<Booking>) => Promise<void>
  updateBookingStatus: (id: number, status: Booking['status']) => Promise<void>
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  loading: false,
  error: null,
  fetchBookings: async () => {
    set({ loading: true })
    try {
      const data = await apiFetch<Booking[]>('/api/bookings')
      set({ bookings: data, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  fetchCustomerBookings: async (id) => {
    set({ loading: true })
    try {
      const data = await apiFetch<Booking[]>(`/api/bookings/customer/${id}`)
      set({ bookings: data, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  fetchAvailableSlots: async (date) => {
    try {
      const raw = await apiFetch<string[]>(`/api/bookings/available-slots/list?date=${date}`)
      return raw.map((t) => ({ startTime: t, endTime: '', isAvailable: true }))
    } catch {
      return []
    }
  },
  createBooking: async (data) => {
    const item = await apiFetch<Booking>('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    set((s) => ({ bookings: [...s.bookings, item] }))
  },
  updateBookingStatus: async (id, status) => {
    const updated = await apiFetch<Booking>(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...updated } : b)) }))
  },
}))

interface AlbumState {
  album: Album | null
  loading: boolean
  error: string | null
  fetchAlbum: (accessKey: string) => Promise<void>
  selectPhotos: (albumId: number, photoIds: number[]) => Promise<void>
}

export const useAlbumStore = create<AlbumState>((set) => ({
  album: null,
  loading: false,
  error: null,
  fetchAlbum: async (accessKey) => {
    set({ loading: true })
    try {
      const data = await apiFetch<Album>(`/api/albums/${accessKey}`)
      set({ album: data, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  selectPhotos: async (albumId, photoIds) => {
    await fetch(`/api/albums/${albumId}/photos/select`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoIds, selected: true }),
    })
    set((s) => {
      if (!s.album) return s
      const photos = s.album.photos.map((p) =>
        photoIds.includes(p.id) ? { ...p, isSelected: !p.isSelected } : p
      )
      return { album: { ...s.album, photos } }
    })
  },
}))

interface CustomerState {
  profile: CustomerProfile | null
  loading: boolean
  error: string | null
  fetchProfile: (id: number) => Promise<void>
  updatePreferences: (id: number, prefs: string[]) => Promise<void>
}

export const useCustomerStore = create<CustomerState>((set) => ({
  profile: null,
  loading: false,
  error: null,
  fetchProfile: async (id) => {
    set({ loading: true })
    try {
      const data = await apiFetch<CustomerProfile>(`/api/customers/${id}/profile`)
      set({ profile: data, loading: false })
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
}))

interface ReviewState {
  reviews: Review[]
  featuredReviews: Review[]
  loading: boolean
  error: string | null
  fetchFeatured: () => Promise<void>
  fetchByService: (serviceId: number) => Promise<void>
  submitReview: (data: Partial<Review>) => Promise<void>
}

export const useReviewStore = create<ReviewState>((set) => ({
  reviews: [],
  featuredReviews: [],
  loading: false,
  error: null,
  fetchFeatured: async () => {
    set({ loading: true })
    try {
      const data = await apiFetch<Review[]>('/api/reviews/featured')
      set({ featuredReviews: data, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  fetchByService: async (serviceId) => {
    set({ loading: true })
    try {
      const data = await apiFetch<Review[]>(`/api/reviews/service/${serviceId}`)
      set({ reviews: data, loading: false })
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
  addHoliday: (data: Partial<Holiday>) => Promise<void>
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
      const data = await apiFetch<ScheduleConfig[]>(`/api/schedule?month=${month}`)
      set({ schedules: data, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
  updateSchedule: async (date, data) => {
    await apiFetch(`/api/schedule/${date}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    set((s) => ({
      schedules: s.schedules.map((sc) => (sc.date === date ? { ...sc, ...data } : sc)),
    }))
  },
  fetchHolidays: async () => {
    try {
      const data = await apiFetch<Holiday[]>('/api/schedule/pricing/holidays')
      set({ holidays: data })
    } catch (e: any) {
      set({ error: e.message })
    }
  },
  addHoliday: async (data) => {
    const item = await apiFetch<Holiday>('/api/schedule/pricing/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    set((s) => ({ holidays: [...s.holidays, item] }))
  },
  deleteHoliday: async (id) => {
    await fetch(`/api/schedule/pricing/holidays/${id}`, { method: 'DELETE' })
    set((s) => ({ holidays: s.holidays.filter((h) => h.id !== id) }))
  },
  fetchSeasonPricing: async () => {
    try {
      const data = await apiFetch<SeasonPricing[]>('/api/schedule/pricing/seasons')
      set({ seasonPricing: data })
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

export const useStatsStore = create<StatsState>((set) => ({
  stats: null,
  loading: false,
  error: null,
  fetchStats: async () => {
    set({ loading: true })
    try {
      const data = await apiFetch<Stats>('/api/stats')
      set({ stats: data, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },
}))

export { API }
