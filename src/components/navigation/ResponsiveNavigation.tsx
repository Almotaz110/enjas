import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNavigation } from './MobileNavigation';
import { DesktopNavigation } from './DesktopNavigation';

export const ResponsiveNavigation: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? <MobileNavigation /> : <DesktopNavigation />}
    </>
  );
};