import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'sm' | 'md' | 'lg';

export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  const bp: Breakpoint = width >= 1024 ? 'lg' : width >= 720 ? 'md' : 'sm';
  return {
    width,
    height,
    bp,
    isSm: bp === 'sm',
    isMd: bp === 'md',
    isLg: bp === 'lg',
    isMobile: width < 720,
    isTablet: width >= 720 && width < 1024,
    isDesktop: width >= 1024,
  };
}
