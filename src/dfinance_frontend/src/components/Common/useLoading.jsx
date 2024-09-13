import { useState, useEffect } from 'react';

export function usePageLoading() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleLoad = () => {
      console.log('Page fully loaded');
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    };

    const handleBeforeUnload = () => {
      console.log('Page is about to unload');
      setIsLoading(true);
    };

    window.addEventListener('load', handleLoad);
    window.addEventListener('beforeunload', handleBeforeUnload);

    if (document.readyState === 'complete') {
      console.log('Document is already fully loaded');
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
