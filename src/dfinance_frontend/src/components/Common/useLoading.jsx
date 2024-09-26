import { useState, useEffect } from 'react';

export function usePageLoading() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    };

    const handleBeforeUnload = () => {
      setIsLoading(true);
    };

    window.addEventListener('load', handleLoad);
    window.addEventListener('beforeunload', handleBeforeUnload);

    if (document.readyState === 'complete') {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000); 
    }

    return () => {
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return isLoading;
}
