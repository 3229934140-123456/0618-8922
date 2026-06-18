import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import Calendar from '@/components/Calendar';
import { useScheduleStore } from '@/store';
import type { ScheduleConfig } from '@/store';

const SEASON_OPTIONS = [
  { value: 'normal', label: '平季' },
  { value: 'peak', label: '旺季' },
  { value: 'off_peak', label: '淡季' },
] as const;

export default function AdminSchedule() {
  const { schedules, holidays, fetchSchedules, fetchHolidays, updateSchedule, addHoliday, deleteHoliday } = useScheduleStore();
  const [selectedDate, setSelectedDate] = useState('');
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ date: '', name: '', priceMultiplier: 1.0 });

  useEffect(() => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    fetchSchedules(month);
    fetchHolidays();
  }, [fetchSchedules, fetchHolidays]);

  const selectedSchedule = schedules.find((s) => s.date === selectedDate);

  const toggleAvailability = async () => {
    if (!selectedDate) return;
    await updateSchedule(selectedDate, {
      isAvailable: selectedSchedule ? !selectedSchedule.isAvailable : false,
    });
  };

  const toggleHoliday = async () => {
    if (!selectedDate) return;
    await updateSchedule(selectedDate, {
      isHoliday: selectedSchedule ? !selectedSchedule.isHoliday : true,
    });
  };

  const changeSeasonType = async (seasonType: ScheduleConfig['seasonType']) => {
    if (!selectedDate) return;
    await updateSchedule(selectedDate, { seasonType });
  };

  const handleAddHoliday = async () => {
    if (!holidayForm.date || !holidayForm.name) return;
    await addHoliday(holidayForm);
    setHolidayForm({ date: '', name: '', priceMultiplier: 1.0 });
    setShowHolidayForm(false);
  };

  const handleDeleteHoliday = async (id: number) => {
    await deleteHoliday(id);
  };

  return (
    <div className="min-h-screen bg-ivory font-body pt-20">
      <div className="container mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-charcoal mb-8">档期管理</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Calendar
              schedules={schedules}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gold/10">
              <h3 className="font-display text-lg text-charcoal mb-4">日期配置</h3>
              {!selectedDate ? (
                <p className="text-sm font-body text-charcoal/40 text-center py-6">请选择日期</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-body text-charcoal/60">当前选择：<span className="text-charcoal font-medium">{selectedDate}</span></p>

                  <button
                    onClick={toggleAvailability}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-body font-medium transition-colors ${
                      selectedSchedule?.isAvailable !== false
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {selectedSchedule?.isAvailable !== false ? '当前：可用 - 点击设为不可用' : '当前：不可用 - 点击设为可用'}
                  </button>

                  <button
                    onClick={toggleHoliday}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-body font-medium transition-colors ${
                      selectedSchedule?.isHoliday
                        ? 'bg-gold/10 text-gold border border-gold/30'
                        : 'bg-ivory text-charcoal/50 border border-gold/20'
                    }`}
                  >
                    {selectedSchedule?.isHoliday ? '取消节假日标记' : '标记为节假日'}
                  </button>

                  <div>
                    <p className="text-sm font-body text-charcoal/60 mb-2">季节类型</p>
                    <div className="flex gap-2">
                      {SEASON_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => changeSeasonType(opt.value)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-body transition-colors ${
                            selectedSchedule?.seasonType === opt.value
                              ? 'bg-gold text-charcoal'
                              : 'bg-ivory text-charcoal/50 border border-gold/20 hover:border-gold'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gold/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-charcoal">节假日列表</h3>
                <button
                  onClick={() => setShowHolidayForm(!showHolidayForm)}
                  className="p-1.5 rounded-lg text-gold hover:bg-gold/10 transition-colors"
                >
                  {showHolidayForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              {showHolidayForm && (
                <div className="mb-4 p-4 bg-ivory rounded-lg space-y-3">
                  <input
                    type="date"
                    value={holidayForm.date}
                    onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gold/20 text-sm font-body focus:outline-none focus:border-gold"
                  />
                  <input
                    value={holidayForm.name}
                    onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                    placeholder="节假日名称"
                    className="w-full px-3 py-2 rounded-lg border border-gold/20 text-sm font-body focus:outline-none focus:border-gold"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-body text-charcoal/50">价格倍率</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={holidayForm.priceMultiplier}
                      onChange={(e) => setHolidayForm({ ...holidayForm, priceMultiplier: Number(e.target.value) })}
                      className="w-20 px-3 py-1.5 rounded-lg border border-gold/20 text-sm font-body focus:outline-none focus:border-gold"
                    />
                  </div>
                  <button
                    onClick={handleAddHoliday}
                    className="w-full px-4 py-2 rounded-lg bg-gold text-charcoal text-sm font-body font-medium hover:bg-gold/90 transition-colors"
                  >
                    添加
                  </button>
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {holidays.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-ivory">
                    <div>
                      <p className="text-sm font-body text-charcoal">{h.name}</p>
                      <p className="text-xs font-body text-charcoal/40">{h.date} · 倍率 {h.priceMultiplier}x</p>
                    </div>
                    <button
                      onClick={() => handleDeleteHoliday(h.id)}
                      className="p-1 text-charcoal/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {holidays.length === 0 && (
                  <p className="text-center text-sm font-body text-charcoal/30 py-4">暂无节假日</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
