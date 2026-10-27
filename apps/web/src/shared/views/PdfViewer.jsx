import { useRef } from 'react';
import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * A PDF inside the app (the browser's own viewer in an iframe, no library): Descargar and Imprimir.
 * `file` = { url, name } (a blob URL) or null.
 */
export function PdfViewer({ file, title, description, onClose }) {
  const frame = useRef(null);
  const download = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };
  return (
    <Dialog open={Boolean(file)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[90dvh] max-w-4xl flex-col gap-3">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => frame.current?.contentWindow?.print()}>
            <Printer /> Imprimir
          </Button>
          <Button size="sm" variant="outline" onClick={download}>
            <Download /> Descargar
          </Button>
        </div>
        {file && <iframe ref={frame} title={title} src={file.url} className="min-h-0 w-full flex-1 rounded-md border border-border" />}
      </DialogContent>
    </Dialog>
  );
}
