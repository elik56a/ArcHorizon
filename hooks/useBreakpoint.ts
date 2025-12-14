
import { useMediaQuery } from './useMediaQuery';

// Tailwind Breakpoints
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px

export const useBreakpoint = () => {
    const isSm = useMediaQuery('(min-width: 640px)');
    const isMd = useMediaQuery('(min-width: 768px)');
    const isLg = useMediaQuery('(min-width: 1024px)');
    const isXl = useMediaQuery('(min-width: 1280px)');
    const is2Xl = useMediaQuery('(min-width: 1536px)');

    return {
        isSm,
        isMd,
        isLg,
        isXl,
        is2Xl,
        // Semantic helpers
        isMobile: !isMd,       // < 768px
        isTablet: isMd && !isLg, // 768px <= width < 1024px
        isDesktop: isLg,       // >= 1024px
        isWide: isXl           // >= 1280px
    };
};
