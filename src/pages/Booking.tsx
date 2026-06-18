import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Info } from 'lucide-react';
import Calendar from '@/components/Calendar';
import BookingModal from '@/components/BookingModal';
import { useBookingStore, useServiceStore, useScheduleStore } from '@/store';
import type { TimeSlotConfig, Booking } from '@/store';

export default function Booking() {
  const { services, fetchServices } = useServiceStore();
  const { fetchAvailableSlots, createBooking, currentCustomerId } = useBookingStore();
  const { schedules, fetchSchedules } = useScheduleStore();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlotConfig[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [bookedSlotsOnDay, setBookedSlotsOnDay] = useState<string[]>([]);
  const [preselectedSlot, setPreselectedSlot] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchServices();
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    fetchSchedules(month);
  }, [fetchServices, fetchSchedules]);

  const handleSelectDate = async (date: string) => {
    setSelectedDate(date);
    setBookedSlotsOnDay([]);
    setPreselectedSlot('');
    const slots = await fetchAvailableSlots(date);
    setTimeSlots(slots);
  };

  const refreshSlots = async (date: string) => {
    const slots = await fetchAvailableSlots(date);
    setTimeSlots(slots);
  };

  const handleBooking = async (data: {
    serviceId: number;
    date: string;
    timeSlot: string;
    notes: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
  }) => {
    setErrorMessage('');
    const result = await createBooking(data);
    if (!result.booking) {
      setErrorMessage(result.error || '该时段已被预约，请选择其他时间');
      setPreselectedSlot('');
      await refreshSlots(data.date);
      return { booking: null, error: result.error };
    }
    const slotStart = data.timeSlot.split('-')[0];
    setBookedSlotsOnDay((prev) => [...prev, slotStart]);
    setPreselectedSlot('');
    await refreshSlots(data.date);
    return { booking: result.booking, error: undefined };
  };

  const handleCloseAfterSuccess = () => {
    setModalOpen(false);
    setPreselectedSlot('');
    if (currentCustomerId) {
      navigate('/my-bookings');
    }
  };

  const selectedSchedule = schedules.find((s) => s.date === selectedDate);
  const displayedSlots = timeSlots.map((slot) => {
    const start = slot.startTime;
    if (bookedSlotsOnDay.includes(start)) {
      return { ...slot, isAvailable: false };
    }
    return slot;
  });
  const availableCount = displayedSlots.filter((t) => t.isAvailable).length;

  return (
    <div className="min-h-screen bg-ivory font-body pt-20">
      <div className="container mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-charcoal mb-8">在线预约</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Calendar
              schedules={schedules}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gold/10">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="w-5 h-5 text-gold" />
                <h3 className="font-display text-lg text-charcoal">选择信息</h3>
              </div>

              {!selectedDate ? (
                <p className="text-sm font-body text-charcoal/40 text-center py-8">
                  请在左侧日历选择日期
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-body text-charcoal/60">预约日期</p>
                    <p className="font-body text-charcoal font-medium">{selectedDate}</p>
                  </div>

                  {selectedSchedule?.isHoliday && (
                    <div className="px-3 py-2 rounded-lg bg-gold/10 text-sm font-body text-gold">
                      🎉 节假日 - 价格上浮 {((selectedSchedule.priceMultiplier - 1) * 100).toFixed(0)}%
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1 text-sm font-body text-charcoal/60 mb-2">
                      <Clock className="w-4 h-4" />
                      可用时段 ({availableCount})
                    </div>
                    {displayedSlots.length > 0 ? (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto">
                        {displayedSlots.map((slot) => {
                          const slotKey = `${slot.startTime}-${slot.endTime}`;
                          const isSelected = preselectedSlot === slotKey;
                          return (
                            <div
                              key={slot.startTime}
                              onClick={() => {
                                if (slot.isAvailable) {
                                  setPreselectedSlot(isSelected ? '' : slotKey);
                                }
                              }}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-body transition-colors ${
                                !slot.isAvailable
                                  ? 'bg-charcoal/5 text-charcoal/30 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-gold text-white shadow-sm cursor-pointer'
                                  : 'bg-ivory text-charcoal/70 hover:bg-gold/10 hover:text-gold cursor-pointer'
                              }`}
                            >
                              <span>
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <span className={`text-xs ${
                                !slot.isAvailable
                                  ? 'text-charcoal/30'
                                  : isSelected
                                  ? 'text-white'
                                  : 'text-gold'
                              }`}>
                                {slot.isAvailable ? (isSelected ? '已选择' : '点击选择') : '已预约'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm font-body text-charcoal/40">暂无可用时段</p>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-xs font-body text-charcoal/40 bg-ivory p-3 rounded-lg">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>点击上方时段先选择时间，再点击预约按钮进入流程。预约成功后该时段自动锁定。</span>
                  </div>

                  <button
                    onClick={() => setModalOpen(true)}
                    disabled={availableCount === 0}
                    className="w-full px-4 py-2.5 rounded-lg bg-gold text-charcoal font-body font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {preselectedSlot ? `预约 ${preselectedSlot}` : '预约'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setPreselectedSlot(''); }}
        onCloseSuccess={handleCloseAfterSuccess}
        services={services}
        selectedDate={selectedDate}
        timeSlots={displayedSlots}
        preselectedSlot={preselectedSlot}
        onSubmit={handleBooking}
      />
    </div>
  );
}
