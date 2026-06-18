import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { useAlbumStore } from '@/store';

export default function Album() {
  const { accessKey } = useParams<{ accessKey: string }>();
  const { album, fetchAlbum, selectPhotos } = useAlbumStore();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [initialSelected, setInitialSelected] = useState<Set<number>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (accessKey) fetchAlbum(accessKey);
  }, [accessKey, fetchAlbum]);

  useEffect(() => {
    if (album) {
      const sel = new Set<number>();
      album.photos.forEach((p) => {
        if (p.isSelected) sel.add(p.id);
      });
      setSelectedIds(sel);
      setInitialSelected(sel);
    }
  }, [album]);

  const toggleSelect = (id: number) => {
    setSaved(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmSelection = async () => {
    if (!album) return;
    setSaving(true);
    setSaved(false);
    try {
      const toSelect: number[] = [];
      const toDeselect: number[] = [];
      selectedIds.forEach((id) => {
        if (!initialSelected.has(id)) toSelect.push(id);
      });
      initialSelected.forEach((id) => {
        if (!selectedIds.has(id)) toDeselect.push(id);
      });
      if (toSelect.length > 0) {
        await selectPhotos(album.id, toSelect, true);
      }
      if (toDeselect.length > 0) {
        await selectPhotos(album.id, toDeselect, false);
      }
      setInitialSelected(new Set(selectedIds));
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () => {
    if (lightboxIndex !== null && album) {
      setLightboxIndex((lightboxIndex - 1 + album.photos.length) % album.photos.length);
    }
  };
  const nextPhoto = () => {
    if (lightboxIndex !== null && album) {
      setLightboxIndex((lightboxIndex + 1) % album.photos.length);
    }
  };

  const pendingCount = useMemo(() => {
    if (!album) return 0;
    let diff = 0;
    selectedIds.forEach((id) => {
      if (!initialSelected.has(id)) diff++;
    });
    initialSelected.forEach((id) => {
      if (!selectedIds.has(id)) diff++;
    });
    return diff;
  }, [selectedIds, initialSelected, album]);

  if (!album) {
    return (
      <div className="min-h-screen bg-charcoal font-body flex items-center justify-center">
        <p className="text-ivory/40">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal font-body">
      <div className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-3xl text-ivory mb-2">{album.title}</h1>
            <div className="flex items-center gap-4 text-sm font-body text-ivory/40">
              <span>共 {album.totalPhotos} 张照片</span>
              <span className="text-gold">
                已选 {selectedIds.size} 张
                {initialSelected.size > 0 && (
                  <span className="text-ivory/30">（已保存 {initialSelected.size} 张）</span>
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {album.photos.map((photo, index) => {
              const isSelected = selectedIds.has(photo.id);
              return (
                <div
                  key={photo.id}
                  className={`relative group rounded-xl overflow-hidden transition-all ${
                    isSelected ? 'ring-2 ring-gold ring-offset-2 ring-offset-charcoal' : 'ring-1 ring-ivory/10'
                  }`}
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt=""
                    className="w-full aspect-[3/4] object-cover cursor-pointer"
                  />
                  <div
                    className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(photo.id);
                    }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-gold text-charcoal'
                          : 'border-2 border-ivory/50 text-ivory/50 hover:border-gold hover:text-gold'
                      }`}
                    >
                      <Check className={`w-5 h-5 ${isSelected ? '' : 'opacity-0'}`} />
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gold flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-charcoal" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-charcoal/80 to-transparent pointer-events-none">
                    <div className="absolute bottom-2 left-3 text-xs text-ivory/70 font-body">
                      {index + 1} / {album.totalPhotos}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-charcoal/95 backdrop-blur-sm border-t border-gold/20 px-6 py-4 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="font-body text-ivory/60">
            已选 <span className="text-gold font-medium">{selectedIds.size}</span> / 共{' '}
            {album.totalPhotos} 张
            {pendingCount > 0 && (
              <span className="ml-3 text-xs text-ivory/40">（{pendingCount} 项待保存）</span>
            )}
            {saved && !saving && (
              <span className="ml-3 text-xs text-green-400 inline-flex items-center gap-1">
                <Check className="w-3 h-3" /> 已保存成功
              </span>
            )}
          </div>
          <button
            onClick={confirmSelection}
            disabled={saving || (pendingCount === 0 && !saved)}
            className="px-6 py-2.5 rounded-lg bg-gold text-charcoal font-body font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                确认选片
              </>
            )}
          </button>
        </div>
      </div>

      {lightboxIndex !== null && album.photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-charcoal/98 flex items-center justify-center select-none"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-6 right-6 text-ivory/60 hover:text-ivory p-2"
            onClick={closeLightbox}
          >
            <X className="w-8 h-8" />
          </button>
          <button
            className="absolute left-4 md:left-10 text-ivory/60 hover:text-ivory p-2"
            onClick={(e) => {
              e.stopPropagation();
              prevPhoto();
            }}
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <img
            src={album.photos[lightboxIndex].url}
            alt=""
            className="max-h-[85vh] max-w-[85vw] object-contain"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
          <button
            className="absolute right-4 md:right-10 text-ivory/60 hover:text-ivory p-2"
            onClick={(e) => {
              e.stopPropagation();
              nextPhoto();
            }}
          >
            <ChevronRight className="w-10 h-10" />
          </button>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <span className="text-sm text-ivory/50 font-body">
              {lightboxIndex + 1} / {album.photos.length}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSelect(album.photos[lightboxIndex].id);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body transition-all ${
                selectedIds.has(album.photos[lightboxIndex].id)
                  ? 'bg-gold text-charcoal'
                  : 'bg-ivory/10 text-ivory hover:bg-gold/20'
              }`}
            >
              <Check className="w-4 h-4" />
              {selectedIds.has(album.photos[lightboxIndex].id) ? '已选' : '选择这张'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
