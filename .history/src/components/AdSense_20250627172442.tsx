'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle?: {
      push: (params: {}) => void;
    }[];
  }
}

interface AdSenseProps {
  adSlot: string;
  adFormat?: string;
  responsive?: boolean;
  className?: string;
}

const AdSense: React.FC<AdSenseProps> = ({ adSlot, adFormat = 'auto', responsive = true, className = '' }) => {
  useEffect(() => {
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-0000000000000000" // Placeholder Publisher ID
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={responsive.toString()}
      ></ins>
    </div>
  );
};

export default AdSense; 