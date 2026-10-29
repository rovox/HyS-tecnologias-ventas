// The toaster (sonner) loads after the first paint (GATE-01); notifications wait until it is mounted, so none is lost.
let markReady;
export const toasterReady = new Promise((resolve) => {
  markReady = resolve;
});
export const markToasterReady = () => markReady();
