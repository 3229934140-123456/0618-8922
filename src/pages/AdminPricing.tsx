import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, X, Calculator } from 'lucide-react';
import { useScheduleStore, useServiceStore } from '@/store';
import type { SeasonPricing, Holiday } from '@/store';

const SEASON_LABELS: Record<string, string> = {
  peak: '旺季',
  off_peak: '淡季',
  normal: '平季',
};

const SEASON_COLORS: Record<string, string> = {
  peak: 'bg-red-50 text-red-700',
  off_peak: 'bg-blue-50 text-blue-700',
  normal: 'bg-ivory text-charcoal/70',
};

export default function AdminPricing() {
  const { seasonPricing, holidays, fetchSeasonPricing, fetchHolidays, updateSeasonPricing, addHoliday, deleteHoliday } = useScheduleStore();
  const { services, fetchServices } = useServiceStore();
  const [pricingGrid, setPricingGrid] = useState<SeasonPricing[]>([]);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ date: '', name: '', priceMultiplier: 1.0 });
  const [previewService, setPreviewService] = useState<number>(0);
  const [previewSeason, setPreviewSeason] = useState<string>('peak');

  useEffect(() => {
    fetchSeasonPricing();
    fetchHolidays();
    fetchServices();
  }, [fetchSeasonPricing, fetchHolidays, fetchServices]);

  useEffect(() => {
    setPricingGrid(seasonPricing);
  }, [seasonPricing]);

  const getMultiplier = (serviceId: number, seasonType: string) => {
    const item = pricingGrid.find((p) => p.serviceId === serviceId && p.seasonType === seasonType);
    return item?.multiplier ?? 1.0;
  };

  const setMultiplier = (serviceId: number, seasonType: SeasonPricing['seasonType'], multiplier: number) => {
    setPricingGrid((prev) => {
      const idx = prev.findIndex((p) => p.serviceId === serviceId && p.seasonType === seasonType);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], multiplier };
        return next;
      }
      return [...prev, { serviceId, seasonType, multiplier }];
    });
  };

  const handleSave = async () => {
    await updateSeasonPricing(pricingGrid);
  };

  const handleAddHoliday = async () => {
    if (!holidayForm.date || !holidayForm.name) return;
    await addHoliday(holidayForm);
    setHolidayForm({ date: '', name: '', priceMultiplier: 1.0 });
    setShowHolidayForm(false);
  };

  const previewServiceData = services.find((s) => s.id === previewService);
  const previewMultiplier = getMultiplier(previewService, previewSeason);

  return (
    <div className="min-h-screen bg-ivory font-body pt-20">
      <div className="container mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl text-charcoal">价格配置</h1>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-charcoal font-body font-medium hover:bg-gold/90 transition-colors"
          >
            <Save className="w-4 h-4" />
            保存配置
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gold/10 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gold/10">
            <h2 className="font-display text-lg text-charcoal">季节价格倍率</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-ivory text-xs font-body text-charcoal/50">
                  <th className="text-left px-6 py-3">服务</th>
                  <th className="text-center px-6 py-3">平季</th>
                  <th className="text-center px-6 py-3">旺季</th>
                  <th className="text-center px-6 py-3">淡季</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-t border-gold/5">
                    <td className="px-6 py-3">
                      <p className="text-sm font-body text-charcoal font-medium">{service.name}</p>
                      <p className="text-xs font-body text-charcoal/40">基础价 ¥{service.basePrice}</p>
                    </td>
                    {(['normal', 'peak', 'off_peak'] as const).map((season) => (
                      <td key={season} className="px-6 py-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={getMultiplier(service.id, season)}
                            onChange={(e) => setMultiplier(service.id, season, Number(e.target.value))}
                            className="w-16 px-2 py-1.5 rounded-lg border border-gold/20 text-sm font-body text-charcoal text-center focus:outline-none focus:border-gold"
                          />
                          <span className="text-xs font-body text-charcoal/30">x</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {services.length === 0 && (
            <div className="text-center py-12 text-charcoal/40 font-body">请先添加服务</div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gold/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-charcoal">节假日管理</h2>
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
              {holidays.map((h: Holiday) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-ivory">
                  <div>
                    <p className="text-sm font-body text-charcoal">{h.name}</p>
                    <p className="text-xs font-body text-charcoal/40">{h.date} · 倍率 {h.priceMultiplier}x</p>
                  </div>
                  <button
                    onClick={() => deleteHoliday(h.id)}
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

          <div className="bg-white rounded-xl shadow-sm border border-gold/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-gold" />
              <h2 className="font-display text-lg text-charcoal">价格预览</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-body text-charcoal/60 mb-2 block">选择服务</label>
                <select
                  value={previewService}
                  onChange={(e) => setPreviewService(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold/20 text-sm font-body text-charcoal focus:outline-none focus:border-gold"
                >
                  <option value={0}>请选择</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-body text-charcoal/60 mb-2 block">季节类型</label>
                <div className="flex gap-2">
                  {(['normal', 'peak', 'off_peak'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setPreviewSeason(s)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-body transition-colors ${
                        previewSeason === s ? 'bg-gold text-charcoal' : `${SEASON_COLORS[s]} border border-gold/20`
                      }`}
                    >
                      {SEASON_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {previewServiceData && (
                <div className="bg-ivory p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-charcoal/60">基础价格</span>
                    <span className="text-charcoal">¥{previewServiceData.basePrice}</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-charcoal/60">季节倍率</span>
                    <span className="text-charcoal">{previewMultiplier}x</span>
                  </div>
                  <div className="border-t border-gold/10 pt-2 flex justify-between text-sm font-body">
                    <span className="text-charcoal font-medium">计算价格</span>
                    <span className="text-gold font-display text-xl">
                      ¥{Math.round(previewServiceData.basePrice * previewMultiplier)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
