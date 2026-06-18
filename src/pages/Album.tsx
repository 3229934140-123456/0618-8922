import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useAlbumStore } from '@/store';

export default function Album() {
  const { accessKey } = useParams<{ accessKey: string }>();
  const { album, fetchAlbum, selectPhotos } = useAlbumStore();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (accessKey) fetchAlbum(accessKey);
  }, [accessKey, fetchAlbum]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmSelection = async () => {
    if (!album) return;
    await selectPhotos(album.id, Array.from(selectedIds));
    setSelectedIds(new Set());
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
            <p className="text-sm font-body text-ivory/40">共 {album.totalPhotos} 张照片</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {album.photos.map((photo, index) => {
              const isSelected = selectedIds.has(photo.id) || photo.isSelected;
              return (
                <div
                  key={photo.id}
                  className={`relative group rounded-xl overflow-hidden cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-gold' : 'ring-1 ring-ivory/10'
                  }`}
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt=""
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); toggleSelect(photo.id); }}
                  >
                    {isSelected ? (
                      <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
                        <Check className="w-5 h-5 text-charcoal" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-ivory/50 flex items-center justify-center" />
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                      <Check className="w-4 h-4 text-charcoal" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-charcoal/95 backdrop-blur-sm border-t border-gold/20 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <p className="font-body text-ivory/60">
              已选 <span className="text-gold font-medium">{selectedIds.size}</span> / 共 {album.totalPhotos} 张
            </p>
            <button
              onClick={confirmSelection}
              className="px-6 py-2.5 rounded-lg bg-gold text-charcoal font-body font-medium hover:bg-gold/90 transition-colors"
            >
              确认选片
            </button>
          </div>
        </div>
      )}

      {lightboxIndex !== null && album.photos[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-charcoal/95 flex items-center justify-center" onClick={closeLightbox}>
          <button className="absolute top-6 right-6 text-ivory/60 hover:text-ivory" onClick={closeLightbox}>
            <X className="w-8 h-8" />
          </button>
          <button
            className="absolute left-4 text-ivory/60 hover:text-ivory"
            onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <img
            src={album.photos[lightboxIndex].url}
            alt=""
            className="max-h-[85vh] max-w-[85vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 text-ivory/60 hover:text-ivory"
            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
          >
            <ChevronRight className="w-10 h-10" />
          </button>
          <p className="absolute bottom-6 font-body text-sm text-ivory/40">
            {lightboxIndex + 1} / {album.photos.length}
          </p>
        </div>
      )}
    </div>
  );
}
