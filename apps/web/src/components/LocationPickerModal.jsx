import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { MapPinned, Search, Check } from 'lucide-react';
import { toast } from 'sonner';

// Attempts to extract latitude/longitude from a Google Maps URL.
// Supports formats like:
// https://www.google.com/maps/@-17.393,-66.157,15z
// https://www.google.com/maps?q=-17.393,-66.157
// https://maps.google.com/maps/place/.../@-17.393,-66.157,17z
const extractLatLngFromLink = (link) => {
  if (!link) return null;
  const atMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = link.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  return null;
};

const hasGoogleMapsApi = () => typeof window !== 'undefined' && !!window.google?.maps;

const LocationPickerModal = ({ isOpen, onClose, initialLugar = '', initialMapsLink = '', initialLat = '', initialLng = '', onConfirm }) => {
  const [lugar, setLugar] = useState(initialLugar);
  const [mapsLink, setMapsLink] = useState(initialMapsLink);
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const apiAvailable = hasGoogleMapsApi();

  useEffect(() => {
    if (isOpen) {
      setLugar(initialLugar);
      setMapsLink(initialMapsLink);
      setLat(initialLat);
      setLng(initialLng);
    }
  }, [isOpen, initialLugar, initialMapsLink, initialLat, initialLng]);

  const handleMapsLinkChange = (value) => {
    setMapsLink(value);
    const coords = extractLatLngFromLink(value);
    if (coords) {
      setLat(coords.lat);
      setLng(coords.lng);
    }
  };

  const handleSearchInGoogleMaps = () => {
    if (!lugar.trim()) {
      toast.error('Escribe primero la dirección o lugar a buscar.');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar.trim())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleConfirm = () => {
    if (!lugar.trim()) {
      toast.error('El lugar/dirección es obligatorio.');
      return;
    }
    onConfirm({
      lugar: lugar.trim(),
      latitud: lat !== '' ? parseFloat(lat) : null,
      longitud: lng !== '' ? parseFloat(lng) : null,
      google_maps_link: mapsLink.trim()
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2.5 rounded-full">
              <MapPinned className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold tracking-tight">Marcar ubicación en mapa</DialogTitle>
              <DialogDescription className="font-medium mt-1">
                {apiAvailable
                  ? 'Busca la dirección o ajusta las coordenadas.'
                  : 'Google Maps API no está configurada. Busca la dirección en Google Maps y pega el enlace para completar coordenadas automáticamente.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Lugar / Dirección <span className="text-destructive">*</span></Label>
            <Input value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder="Ej: Av. América esq. Melchor Pérez" />
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" className="font-bold text-xs h-8" onClick={handleSearchInGoogleMaps}>
              <Search className="h-3.5 w-3.5 mr-1.5" /> Buscar en Google Maps
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Enlace de Google Maps (opcional)</Label>
            <Input
              value={mapsLink}
              onChange={(e) => handleMapsLinkChange(e.target.value)}
              placeholder="Pega aquí el enlace de Google Maps"
            />
            <p className="text-[11px] text-muted-foreground">Si el enlace contiene coordenadas, se completan automáticamente.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitud</Label>
              <Input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-17.3935" />
            </div>
            <div className="space-y-2">
              <Label>Longitud</Label>
              <Input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-66.1570" />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="font-bold">Cancelar</Button>
          <Button type="button" onClick={handleConfirm} className="font-bold px-6">
            <Check className="h-4 w-4 mr-2" /> Confirmar Ubicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPickerModal;
