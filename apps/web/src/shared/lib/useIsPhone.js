import { useEffect, useState } from 'react';

const QUERY = '(max-width: 639px)';

/** True below Tailwind's `sm` breakpoint; follows window resizes. */
export function useIsPhone() {
  const [phone, setPhone] = useState(() => window.matchMedia(QUERY).matches);
  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = () => setPhone(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return phone;
}
