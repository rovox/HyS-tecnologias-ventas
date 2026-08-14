import React, { useState } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, ZoomIn } from 'lucide-react';

const PhotoGallery = ({ record, photos = [] }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!photos || photos.length === 0) return null;

  const getGridClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-2 lg:grid-cols-4';
  };

  return (
    <>
      <div className={`grid gap-2 mt-4 ${getGridClass(photos.length)}`}>
        {photos.map((photo, idx) => {
          const url = pb.files.getUrl(record, photo);
          return (
            <div 
              key={idx} 
              className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group bg-muted"
              onClick={() => setSelectedPhoto(url)}
            >
              <img 
                src={url} 
                alt={`Adjunto ${idx + 1}`} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <ZoomIn className="text-white h-8 w-8" />
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-screen-lg p-0 bg-black/95 border-none overflow-hidden flex items-center justify-center">
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          {selectedPhoto && (
            <img 
              src={selectedPhoto} 
              alt="Vista previa" 
              className="w-full max-h-[90vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotoGallery;