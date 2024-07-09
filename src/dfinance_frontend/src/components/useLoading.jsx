import { useState, useEffect } from 'react';

export function usePageLoading() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleLoad = () => {
      console.log('Page fully loaded');
      setIsLoading(false);
    };
    const handleBeforeUnload = () => {
      console.log('Page is about to unload');
      setIsLoading(true);
    };

    window.addEventListener('load', handleLoad);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Check if the document is already loaded
    if (document.readyState === 'complete') {
      console.log('Document is already fully loaded');
      setIsLoading(false);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return isLoading;
}
