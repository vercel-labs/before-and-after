import { describe, it, expect } from 'vitest';
import { detectRoutes } from '../../src/routes';
import { detectAppRouterRoutes, detectPagesRouterRoutes } from '../../src/routes/nextjs';
import { detectGenericRoutes } from '../../src/routes/generic';

// ============================================================
// Next.js App Router
// ============================================================

describe('Next.js App Router route detection', () => {
  describe('page files → high confidence', () => {
    it('maps app/page.tsx to /', () => {
      const routes = detectAppRouterRoutes(['app/page.tsx']);
      expect(routes).toEqual([{
        path: '/',
        sourceFile: 'app/page.tsx',
        confidence: 'high',
        reason: 'Direct page file change',
      }]);
    });

    it('maps app/dashboard/page.tsx to /dashboard', () => {
      const routes = detectAppRouterRoutes(['app/dashboard/page.tsx']);
      expect(routes).toHaveLength(1);
      expect(routes[0].path).toBe('/dashboard');
      expect(routes[0].confidence).toBe('high');
    });

    it('maps nested route app/dashboard/settings/page.tsx to /dashboard/settings', () => {
      const routes = detectAppRouterRoutes(['app/dashboard/settings/page.tsx']);
      expect(routes[0].path).toBe('/dashboard/settings');
      expect(routes[0].confidence).toBe('high');
    });

    it('handles .jsx extension', () => {
      const routes = detectAppRouterRoutes(['app/about/page.jsx']);
      expect(routes[0].path).toBe('/about');
    });

    it('handles .js extension', () => {
      const routes = detectAppRouterRoutes(['app/about/page.js']);
      expect(routes[0].path).toBe('/about');
    });
  });

  describe('route groups → stripped from path', () => {
    it('strips (marketing) route group', () => {
      const routes = detectAppRouterRoutes(['app/(marketing)/about/page.tsx']);
      expect(routes[0].path).toBe('/about');
    });

    it('strips (auth) route group', () => {
      const routes = detectAppRouterRoutes(['app/(auth)/login/page.tsx']);
      expect(routes[0].path).toBe('/login');
    });

    it('strips multiple route groups', () => {
      const routes = detectAppRouterRoutes(['app/(marketing)/(landing)/pricing/page.tsx']);
      expect(routes[0].path).toBe('/pricing');
    });

    it('route group at root maps to /', () => {
      const routes = detectAppRouterRoutes(['app/(marketing)/page.tsx']);
      expect(routes[0].path).toBe('/');
    });
  });

  describe('dynamic segments → preserved', () => {
    it('preserves [slug] in path', () => {
      const routes = detectAppRouterRoutes(['app/blog/[slug]/page.tsx']);
      expect(routes[0].path).toBe('/blog/[slug]');
    });

    it('preserves [...catchAll] in path', () => {
      const routes = detectAppRouterRoutes(['app/docs/[...slug]/page.tsx']);
      expect(routes[0].path).toBe('/docs/[...slug]');
    });

    it('preserves [[...optionalCatchAll]] in path', () => {
      const routes = detectAppRouterRoutes(['app/docs/[[...slug]]/page.tsx']);
      expect(routes[0].path).toBe('/docs/[[...slug]]');
    });
  });

  describe('layout files → medium confidence', () => {
    it('maps app/layout.tsx to /', () => {
      const routes = detectAppRouterRoutes(['app/layout.tsx']);
      expect(routes[0].path).toBe('/');
      expect(routes[0].confidence).toBe('medium');
    });

    it('maps app/dashboard/layout.tsx to /dashboard', () => {
      const routes = detectAppRouterRoutes(['app/dashboard/layout.tsx']);
      expect(routes[0].path).toBe('/dashboard');
      expect(routes[0].confidence).toBe('medium');
    });
  });

  describe('special files → medium confidence', () => {
    it('maps loading.tsx to route', () => {
      const routes = detectAppRouterRoutes(['app/dashboard/loading.tsx']);
      expect(routes[0].path).toBe('/dashboard');
      expect(routes[0].confidence).toBe('medium');
    });

    it('maps error.tsx to route', () => {
      const routes = detectAppRouterRoutes(['app/dashboard/error.tsx']);
      expect(routes[0].path).toBe('/dashboard');
      expect(routes[0].confidence).toBe('medium');
    });

    it('maps not-found.tsx to route', () => {
      const routes = detectAppRouterRoutes(['app/not-found.tsx']);
      expect(routes[0].path).toBe('/');
      expect(routes[0].confidence).toBe('medium');
    });

    it('maps template.tsx to route', () => {
      const routes = detectAppRouterRoutes(['app/dashboard/template.tsx']);
      expect(routes[0].path).toBe('/dashboard');
      expect(routes[0].confidence).toBe('medium');
    });
  });

  describe('components in app/ → medium confidence', () => {
    it('maps app/dashboard/components/Chart.tsx to /dashboard', () => {
      const routes = detectAppRouterRoutes(['app/dashboard/components/Chart.tsx']);
      expect(routes[0].path).toBe('/dashboard');
      expect(routes[0].confidence).toBe('medium');
    });

    it('maps app/components/Header.tsx to /', () => {
      const routes = detectAppRouterRoutes(['app/components/Header.tsx']);
      expect(routes[0].path).toBe('/');
      expect(routes[0].confidence).toBe('medium');
    });

    it('maps app/dashboard/ui/Button.tsx to /dashboard', () => {
      const routes = detectAppRouterRoutes(['app/dashboard/ui/Button.tsx']);
      expect(routes[0].path).toBe('/dashboard');
      expect(routes[0].confidence).toBe('medium');
    });
  });

  describe('API routes → skipped', () => {
    it('skips app/api/route.ts', () => {
      const routes = detectAppRouterRoutes(['app/api/route.ts']);
      expect(routes).toHaveLength(0);
    });

    it('skips app/api/users/route.ts', () => {
      const routes = detectAppRouterRoutes(['app/api/users/route.ts']);
      expect(routes).toHaveLength(0);
    });

    it('skips middleware.ts', () => {
      const routes = detectAppRouterRoutes(['middleware.ts']);
      expect(routes).toHaveLength(0);
    });
  });

  describe('global files → low confidence "/"', () => {
    it('maps globals.css to /', () => {
      const routes = detectAppRouterRoutes(['app/globals.css']);
      expect(routes[0].path).toBe('/');
      expect(routes[0].confidence).toBe('low');
    });

    it('maps tailwind.config.ts to /', () => {
      const routes = detectAppRouterRoutes(['tailwind.config.ts']);
      expect(routes[0].path).toBe('/');
      expect(routes[0].confidence).toBe('low');
    });

    it('maps postcss.config.mjs to /', () => {
      const routes = detectAppRouterRoutes(['postcss.config.mjs']);
      expect(routes[0].path).toBe('/');
      expect(routes[0].confidence).toBe('low');
    });
  });

  describe('config files → skipped', () => {
    it('skips package.json', () => {
      const routes = detectAppRouterRoutes(['package.json']);
      expect(routes).toHaveLength(0);
    });

    it('skips tsconfig.json', () => {
      const routes = detectAppRouterRoutes(['tsconfig.json']);
      expect(routes).toHaveLength(0);
    });
  });

  describe('parallel routes → stripped', () => {
    it('strips @modal from path', () => {
      const routes = detectAppRouterRoutes(['app/@modal/login/page.tsx']);
      expect(routes[0].path).toBe('/login');
    });
  });
});

// ============================================================
// Next.js Pages Router
// ============================================================

describe('Next.js Pages Router route detection', () => {
  it('maps pages/index.tsx to /', () => {
    const routes = detectPagesRouterRoutes(['pages/index.tsx']);
    expect(routes[0].path).toBe('/');
    expect(routes[0].confidence).toBe('high');
  });

  it('maps pages/about.tsx to /about', () => {
    const routes = detectPagesRouterRoutes(['pages/about.tsx']);
    expect(routes[0].path).toBe('/about');
    expect(routes[0].confidence).toBe('high');
  });

  it('maps pages/blog/[slug].tsx to /blog/[slug]', () => {
    const routes = detectPagesRouterRoutes(['pages/blog/[slug].tsx']);
    expect(routes[0].path).toBe('/blog/[slug]');
  });

  it('maps pages/dashboard/index.tsx to /dashboard', () => {
    const routes = detectPagesRouterRoutes(['pages/dashboard/index.tsx']);
    expect(routes[0].path).toBe('/dashboard');
  });

  it('skips pages/api/ routes', () => {
    const routes = detectPagesRouterRoutes(['pages/api/users.ts']);
    expect(routes).toHaveLength(0);
  });

  it('maps pages/_app.tsx to / with medium confidence', () => {
    const routes = detectPagesRouterRoutes(['pages/_app.tsx']);
    expect(routes[0].path).toBe('/');
    expect(routes[0].confidence).toBe('medium');
  });

  it('maps pages/_document.tsx to / with medium confidence', () => {
    const routes = detectPagesRouterRoutes(['pages/_document.tsx']);
    expect(routes[0].path).toBe('/');
    expect(routes[0].confidence).toBe('medium');
  });
});

// ============================================================
// Generic route detection
// ============================================================

describe('Generic route detection', () => {
  it('maps routes/dashboard.tsx to /dashboard', () => {
    const routes = detectGenericRoutes(['routes/dashboard.tsx']);
    expect(routes[0].path).toBe('/dashboard');
    expect(routes[0].confidence).toBe('high');
  });

  it('maps routes/_index.tsx to /', () => {
    const routes = detectGenericRoutes(['routes/_index.tsx']);
    expect(routes[0].path).toBe('/');
  });

  it('maps src/routes/about.tsx to /about', () => {
    const routes = detectGenericRoutes(['src/routes/about.tsx']);
    expect(routes[0].path).toBe('/about');
  });

  it('maps src/pages/index.tsx to /', () => {
    const routes = detectGenericRoutes(['src/pages/index.tsx']);
    expect(routes[0].path).toBe('/');
    expect(routes[0].confidence).toBe('medium');
  });

  it('maps src/pages/about.tsx to /about', () => {
    const routes = detectGenericRoutes(['src/pages/about.tsx']);
    expect(routes[0].path).toBe('/about');
  });

  it('maps src/routes/+page.svelte (SvelteKit) to /', () => {
    const routes = detectGenericRoutes(['src/routes/+page.svelte']);
    expect(routes[0].path).toBe('/');
    expect(routes[0].confidence).toBe('high');
  });

  it('maps src/routes/about/+page.svelte to /about', () => {
    const routes = detectGenericRoutes(['src/routes/about/+page.svelte']);
    expect(routes[0].path).toBe('/about');
  });

  it('maps component files to / with low confidence', () => {
    const routes = detectGenericRoutes(['src/components/Header.tsx']);
    expect(routes[0].path).toBe('/');
    expect(routes[0].confidence).toBe('low');
  });

  it('maps global CSS to / with low confidence', () => {
    const routes = detectGenericRoutes(['globals.css']);
    expect(routes[0].path).toBe('/');
    expect(routes[0].confidence).toBe('low');
  });

  it('skips test files', () => {
    const routes = detectGenericRoutes(['src/components/Header.test.tsx']);
    expect(routes).toHaveLength(0);
  });

  it('skips package.json', () => {
    const routes = detectGenericRoutes(['package.json']);
    expect(routes).toHaveLength(0);
  });
});

// ============================================================
// detectRoutes (main entry point)
// ============================================================

describe('detectRoutes', () => {
  it('returns empty array for no files', () => {
    expect(detectRoutes([])).toEqual([]);
  });

  it('deduplicates routes by path, keeping highest confidence', () => {
    const routes = detectRoutes([
      'app/dashboard/page.tsx',      // high confidence → /dashboard
      'app/dashboard/layout.tsx',    // medium confidence → /dashboard
    ], { framework: 'nextjs-app' });

    const dashboardRoutes = routes.filter(r => r.path === '/dashboard');
    expect(dashboardRoutes).toHaveLength(1);
    expect(dashboardRoutes[0].confidence).toBe('high');
  });

  it('sorts by confidence: high → medium → low', () => {
    const routes = detectRoutes([
      'tailwind.config.ts',           // low → /
      'app/dashboard/layout.tsx',     // medium → /dashboard
      'app/settings/page.tsx',        // high → /settings
    ], { framework: 'nextjs-app' });

    expect(routes[0].confidence).toBe('high');
    expect(routes[routes.length - 1].confidence).toBe('low');
  });

  it('respects maxRoutes option', () => {
    const files = [
      'app/page.tsx',
      'app/about/page.tsx',
      'app/blog/page.tsx',
      'app/contact/page.tsx',
      'app/pricing/page.tsx',
      'app/docs/page.tsx',
    ];

    const routes = detectRoutes(files, { framework: 'nextjs-app', maxRoutes: 3 });
    expect(routes.length).toBeLessThanOrEqual(3);
  });

  it('defaults maxRoutes to 5', () => {
    const files = Array.from({ length: 10 }, (_, i) =>
      `app/page${i}/page.tsx`
    );

    const routes = detectRoutes(files, { framework: 'nextjs-app' });
    expect(routes.length).toBeLessThanOrEqual(5);
  });

  it('handles mixed high and low confidence files', () => {
    const routes = detectRoutes([
      'app/dashboard/page.tsx',    // high → /dashboard
      'tailwind.config.ts',        // low → /
      'app/api/users/route.ts',    // skipped
    ], { framework: 'nextjs-app' });

    expect(routes).toHaveLength(2);
    expect(routes[0].path).toBe('/dashboard');
    expect(routes[1].path).toBe('/');
  });

  it('uses forced framework', () => {
    const routes = detectRoutes(
      ['pages/about.tsx'],
      { framework: 'nextjs-pages' }
    );
    expect(routes[0].path).toBe('/about');
  });
});
