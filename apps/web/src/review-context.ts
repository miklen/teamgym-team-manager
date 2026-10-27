import { createContext } from 'react';

export const ReviewRequestContext = createContext<{ available: boolean; request: () => void }>({
  available: false,
  request: () => {},
});
