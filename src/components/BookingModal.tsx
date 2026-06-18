import { useState, useEffect } from 'react'
import { X, Check, Clock, CreditCard, TrendingUp } from 'lucide-react'
import type { Service, TimeSlotConfig, Booking } from '@/store'

interface PricePreview {
  basePrice: number
  depositRate: number
  multiplier: number
  multiplierType: string
  totalPrice: number
  depositAmount: number
}

interface BookingModalProps {
  open: boolean
  onClose: () => void
  onCloseSuccess?: () => void
  services: Service[]
  selectedDate: string
  timeSlots: TimeSlotConfig[]
  preselectedSlot?: string
  onSubmit: (data: {
    serviceId: number
    date: string
    timeSlot: string
    notes: string
    customerName: string
    customerPhone: string
    customerEmail: string
  }) => Promise<Booking | null>
}

interface CustomerInfo {
  name: string
  phone: string
  email: string
  notes: string
}

const STEPS = ['选择服务', '选择时间', '填写信息', '确认支付']

export default function BookingModal({
  open,
  onClose,
  onCloseSuccess,
  services,
  selectedDate,
  timeSlots,
  preselectedSlot,
  onSubmit,
}: BookingModalProps) {
  const [step, setStep] = useState(0)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pricePreview, setPricePreview] = useState<PricePreview | null>(null)

  useEffect(() => {
    if (open) {
      if (preselectedSlot) {
        setSelectedSlot(preselectedSlot)
        setStep(1)
      } else {
        setStep(0)
      }
      setSubmitted(false)
      setSubmitting(false)
      setPricePreview(null)
    }
  }, [open, preselectedSlot])

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetch(`/api/bookings/price/preview?serviceId=${selectedService.id}&date=${selectedDate}`)
        .then((r) => r.json())
        .then((r) => {
          if (r.success) setPricePreview(r.data)
        })
        .catch(() => setPricePreview(null))
    } else {
      setPricePreview(null)
    }
  }, [selectedService, selectedDate])

  const reset = () => {
    setStep(0)
    setSelectedService(null)
    setSelectedSlot('')
    setCustomerInfo({ name: '', phone: '', email: '', notes: '' })
    setSubmitting(false)
    setSubmitted(false)
    setPricePreview(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmittedClose = () => {
    reset()
    if (onCloseSuccess) onCloseSuccess()
    else onClose()
  }

  const canNext = () => {
    if (step === 0) return selectedService !== null
    if (step === 1) return selectedSlot !== ''
    if (step === 2) return customerInfo.name.trim() !== '' && customerInfo.phone.trim() !== ''
    return true
  }

  const handleNext = () => {
    if (step < 3 && canNext()) setStep(step + 1)
  }

  const handlePrev = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!selectedService || !selectedSlot) return
    setSubmitting(true)
    try {
      const result = await onSubmit({
        serviceId: selectedService.id,
        date: selectedDate,
        timeSlot: selectedSlot,
        notes: customerInfo.notes,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
      })
      if (result) setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const displayBasePrice = pricePreview ? pricePreview.basePrice : selectedService?.basePrice || 0
  const displayTotalPrice = pricePreview ? pricePreview.totalPrice : displayBasePrice
  const displayDeposit = pricePreview ? pricePreview.depositAmount : Math.round(displayBasePrice * (selectedService?.depositRate || 0.3) * 100) / 100
  const displayMultiplier = pricePreview ? pricePreview.multiplier : 1.0
  const multiplierLabel: Record<string, string> = {
    holiday: '节假日',
    peak: '旺季',
    off_peak: '淡季',
    schedule: '档期调整',
    normal: '平日',
  }
  const displayMultiplierLabel = pricePreview ? multiplierLabel[pricePreview.multiplierType] || '平日' : '平日'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/70 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-ivory rounded-2xl shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-charcoal/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-charcoal/60" />
        </button>

        <div className="p-6 pb-0">
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                      i <= step
                        ? 'bg-gold text-white'
                        : 'bg-charcoal/10 text-charcoal/40'
                    }`}
                  >
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-xs hidden sm:block ${
                      i <= step ? 'text-charcoal font-medium' : 'text-charcoal/40'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-px flex-1 mx-2 ${
                      i < step ? 'bg-gold' : 'bg-charcoal/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-charcoal mb-2">
                预约成功！
              </h3>
              <p className="text-charcoal/60 mb-6">
                客户信息已保存，您可以在「我的预约」中查看详情
              </p>
              <button
                onClick={handleSubmittedClose}
                className="px-8 py-3 bg-gradient-to-r from-gold to-gold-light text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                完成
              </button>
            </div>
          ) : (
            <>
              {step === 0 && (
                <div>
                  <h3 className="font-display text-xl font-semibold text-charcoal mb-4">
                    选择服务类型
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {services.map((service) => {
                      const isSel = selectedService?.id === service.id
                      const isPreview = isSel && pricePreview
                      const showMultiplier = isPreview && pricePreview!.multiplier !== 1.0
                      return (
                        <button
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={`p-4 rounded-xl text-left transition-all border-2 ${
                            isSel
                              ? 'border-gold bg-gold/5 shadow-md'
                              : 'border-transparent bg-white hover:border-gold/30 hover:shadow-sm'
                          }`}
                        >
                          <p className="font-medium text-charcoal text-sm mb-1">{service.name}</p>
                          <p className="text-xs text-charcoal/50 mb-2">
                            {service.category === 'id_photo'
                              ? '证件照'
                              : service.category === 'portrait'
                              ? '写真'
                              : service.category === 'commercial'
                              ? '商业产品'
                              : '婚纱预拍'}
                          </p>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-gold font-semibold">
                                ¥{isPreview ? pricePreview!.totalPrice : service.basePrice}
                              </span>
                              {showMultiplier && (
                                <span className="ml-1 text-[10px] text-gold/70 inline-flex items-center gap-0.5">
                                  <TrendingUp className="w-2.5 h-2.5" />
                                  {displayMultiplierLabel}×{pricePreview!.multiplier.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <span className="flex items-center gap-1 text-xs text-charcoal/40">
                              <Clock className="w-3 h-3" />
                              {service.duration}分钟
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h3 className="font-display text-xl font-semibold text-charcoal mb-2">
                    选择时间
                  </h3>
                  <p className="text-sm text-charcoal/50 mb-4">
                    已选服务：{selectedService?.name}　|　日期：{selectedDate}
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-charcoal/70 mb-2">
                      可用时段
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((slot) => {
                        const slotKey = `${slot.startTime}-${slot.endTime}`
                        return (
                          <button
                            key={slotKey}
                            disabled={!slot.isAvailable}
                            onClick={() => setSelectedSlot(slotKey)}
                            className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                              !slot.isAvailable
                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                : selectedSlot === slotKey
                                ? 'bg-gold text-white shadow-sm'
                                : 'bg-white text-charcoal border border-charcoal/10 hover:border-gold'
                            }`}
                          >
                            {slot.startTime}-{slot.endTime}
                          </button>
                        )
                      })}
                    </div>
                    {timeSlots.length === 0 && (
                      <p className="text-sm text-charcoal/40 text-center py-4">当日暂无可用时段</p>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="font-display text-xl font-semibold text-charcoal mb-4">
                    填写个人信息
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal/70 mb-1.5">
                        姓名 <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, name: e.target.value })
                        }
                        placeholder="请输入您的姓名"
                        className="w-full px-4 py-2.5 border border-charcoal/10 rounded-lg bg-white text-charcoal focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal/70 mb-1.5">
                        手机号 <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, phone: e.target.value })
                        }
                        placeholder="请输入手机号码"
                        className="w-full px-4 py-2.5 border border-charcoal/10 rounded-lg bg-white text-charcoal focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal/70 mb-1.5">
                        邮箱
                      </label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, email: e.target.value })
                        }
                        placeholder="选填"
                        className="w-full px-4 py-2.5 border border-charcoal/10 rounded-lg bg-white text-charcoal focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal/70 mb-1.5">
                        备注
                      </label>
                      <textarea
                        value={customerInfo.notes}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, notes: e.target.value })
                        }
                        placeholder="如有特殊需求请备注"
                        rows={3}
                        className="w-full px-4 py-2.5 border border-charcoal/10 rounded-lg bg-white text-charcoal focus:outline-none focus:border-gold transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h3 className="font-display text-xl font-semibold text-charcoal mb-4">
                    确认预约
                  </h3>
                  <div className="bg-white rounded-xl p-5 space-y-3 border border-charcoal/5">
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal/50">服务项目</span>
                      <span className="text-charcoal font-medium">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal/50">预约日期</span>
                      <span className="text-charcoal font-medium">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal/50">预约时段</span>
                      <span className="text-charcoal font-medium">{selectedSlot}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal/50">联系人</span>
                      <span className="text-charcoal font-medium">{customerInfo.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal/50">联系电话</span>
                      <span className="text-charcoal font-medium">{customerInfo.phone}</span>
                    </div>
                    {customerInfo.email && (
                      <div className="flex justify-between text-sm">
                        <span className="text-charcoal/50">邮箱</span>
                        <span className="text-charcoal font-medium">{customerInfo.email}</span>
                      </div>
                    )}
                    {customerInfo.notes && (
                      <div className="flex justify-between text-sm">
                        <span className="text-charcoal/50">备注</span>
                        <span className="text-charcoal font-medium max-w-[60%] text-right">
                          {customerInfo.notes}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-charcoal/10 pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-charcoal/50">基础价格</span>
                        <span className="text-charcoal">¥{displayBasePrice}</span>
                      </div>
                      {displayMultiplier !== 1.0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-charcoal/50 inline-flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {displayMultiplierLabel}倍率
                          </span>
                          <span className="text-gold">×{displayMultiplier.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-charcoal/50">总价</span>
                        <span className="text-charcoal font-medium">¥{displayTotalPrice}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-charcoal/10">
                        <span className="text-charcoal/50 text-sm">
                          定金 ({Math.round((selectedService?.depositRate || 0.3) * 100)}%)
                        </span>
                        <span className="text-gold font-display text-xl font-semibold">¥{displayDeposit}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-warm-gray rounded-lg flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-charcoal/40" />
                    <span className="text-xs text-charcoal/50">
                      支付定金后将为您保留档期，余款 ¥{(displayTotalPrice - displayDeposit).toFixed(2)} 在拍摄当天支付
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-6 pb-6">
                {step > 0 ? (
                  <button
                    onClick={handlePrev}
                    className="px-6 py-2.5 text-charcoal/60 hover:text-charcoal transition-colors text-sm font-medium"
                  >
                    上一步
                  </button>
                ) : (
                  <div />
                )}
                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    disabled={!canNext()}
                    className={`px-8 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      canNext()
                        ? 'bg-gradient-to-r from-gold to-gold-light text-white hover:opacity-90'
                        : 'bg-charcoal/10 text-charcoal/30 cursor-not-allowed'
                    }`}
                  >
                    下一步
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-gold to-gold-light text-white hover:opacity-90 transition-all disabled:opacity-60"
                  >
                    {submitting ? '提交中...' : '确认支付定金'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
