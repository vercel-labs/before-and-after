import { AutoPlayHero } from "@/components/hero";
import { Code } from "@/components/code";
import { Logo } from "@/components/logo";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] text-neutral-500">
      <main className="py-10 sm:py-16">
        {/* Header - constrained width */}
        <div className="max-w-[640px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <a
              href="/pre-post"
              className="text-neutral-800 hover:text-neutral-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded-sm"
            >
              <h1>
                <Logo />
              </h1>
            </a>
            <nav className="flex items-center gap-2.5 sm:gap-4 text-[13px] sm:text-sm font-[family-name:var(--font-departure)]">
              <a
                href="#install"
                className="text-neutral-500 hover:text-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded-sm"
              >
                Install
              </a>
              <a
                href="#skill"
                className="text-neutral-500 hover:text-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded-sm"
              >
                Skill
              </a>
              <a
                href="#options"
                className="text-neutral-500 hover:text-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded-sm"
              >
                Options
              </a>
              <a
                href="https://github.com/juangadm/pre-post"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-neutral-500 hover:text-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded-sm"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
            </nav>
          </div>
          <p className="mb-8 sm:mb-12 text-[14px] sm:text-[15px]">
            Automatic visual diffs for PRs. Pre-post reads your git
            changes, figures out which pages changed, and screenshots
            them.
          </p>
        </div>

        {/* Animation - wider, extra padding on mobile for transformed elements */}
        <div className="mb-10 sm:mb-16 px-8 sm:px-0">
          <AutoPlayHero />
        </div>

        {/* Content - constrained width */}
        <div className="max-w-[640px] mx-auto px-4 sm:px-6 space-y-8 sm:space-y-10">
          <section className="space-y-3">
            <h2 className="text-neutral-800 text-[14px] font-[family-name:var(--font-departure)] flex items-center gap-4 after:content-[''] after:flex-1 after:h-px after:bg-neutral-200">How it works</h2>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>Make your UI changes</li>
              <li>Say <code className="text-neutral-800 bg-neutral-50 px-1 sm:px-1.5 py-0.5 rounded font-mono text-[12px] sm:text-[14px]">/pre-post</code> in Claude Code</li>
              <li>Pre-post reads your git diff and detects which pages changed</li>
              <li>It screenshots each route — production vs your new version</li>
              <li>You review the screenshots</li>
              <li>Pre-post adds a before/after table to your PR</li>
            </ol>
            <p className="text-sm text-neutral-400">
              Works with localhost, Vercel preview deploys, Netlify, or any accessible URL.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-neutral-800 text-[14px] font-[family-name:var(--font-departure)] flex items-center gap-4 after:content-[''] after:flex-1 after:h-px after:bg-neutral-200">What&apos;s different</h2>
            <p className="text-sm">
              Pre-post started as a fork of Vercel&apos;s{" "}
              <a
                href="https://github.com/vercel-labs/before-and-after"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded-sm"
              >
                before-and-after
              </a>
              . The original required you to manually pass two URLs. Pre-post
              reads your <code className="text-neutral-800 bg-neutral-50 px-1 sm:px-1.5 py-0.5 rounded font-mono text-[12px] sm:text-[14px]">git diff</code>,
              detects which routes changed, and captures them automatically —
              desktop and mobile, at 2x retina quality.
            </p>
            <p className="text-sm">
              Under the hood, it uses{" "}
              <a
                href="https://playwright.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded-sm"
              >
                Playwright
              </a>{" "}
              instead of Vercel&apos;s agent-browser. It waits for fonts to load
              and freezes CSS animations before each capture, so screenshots are
              consistent across runs.
            </p>
          </section>

          <section id="install" className="scroll-mt-8 space-y-3">
            <h2 className="text-neutral-800 text-[14px] font-[family-name:var(--font-departure)] flex items-center gap-4 after:content-[''] after:flex-1 after:h-px after:bg-neutral-200">Install</h2>
            <p className="text-sm">Install globally to use from anywhere</p>
            <Code>npm i -g pre-post</Code>
          </section>

          <section id="skill" className="scroll-mt-8 space-y-3">
            <h2 className="text-neutral-800 text-[14px] font-[family-name:var(--font-departure)] flex items-center gap-4 after:content-[''] after:flex-1 after:h-px after:bg-neutral-200">Add Skill</h2>
            <p className="text-sm">
              Show Claude Code how and when to take before and afters. The skill
              uses{" "}
              <code className="text-neutral-800 bg-neutral-50 px-1 sm:px-1.5 py-0.5 rounded font-mono text-[12px] sm:text-[14px]">
                gh
              </code>{" "}
              to detect the associated PR with your branch and{" "}
              <code className="text-neutral-800 bg-neutral-50 px-1 sm:px-1.5 py-0.5 rounded font-mono text-[12px] sm:text-[14px]">
                Playwright
              </code>{" "}
              for browser automation
            </p>
            <Code>npx skills add juangadm/pre-post</Code>
          </section>

          <section id="options" className="scroll-mt-8">
            <details>
              <summary className="text-neutral-800 text-[14px] font-[family-name:var(--font-departure)] cursor-pointer select-none list-none flex items-center gap-1.5 after:content-[''] after:flex-1 after:h-px after:bg-neutral-200 [&::-webkit-details-marker]:hidden">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 transition-transform [[open]>&]:rotate-90"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
                Options
              </summary>
              <div className="mt-4 space-y-6">
                <div className="space-y-2">
                  <p className="text-sm">
                    Capture responsive screenshots (desktop + mobile)
                  </p>
                  <Code>pre-post compare --before-base url1 --after-base url2 --responsive</Code>
                </div>

                <div className="space-y-2">
                  <p className="text-sm">
                    Compare specific routes
                  </p>
                  <Code>pre-post compare --before-base url1 --after-base url2 --routes /dashboard,/settings</Code>
                </div>

                <div className="space-y-2">
                  <p className="text-sm">
                    Capture a specific element using a CSS selector
                  </p>
                  <Code>pre-post url1 url2 &quot;.hero&quot;</Code>
                </div>

                <div className="space-y-2">
                  <p className="text-sm">
                    Use different selectors for before and after
                  </p>
                  <Code>
                    pre-post url1 url2 &quot;.old&quot; &quot;.new&quot;
                  </Code>
                </div>

                <div className="space-y-2">
                  <p className="text-sm">
                    Capture at mobile (375x812), tablet (768x1024), or custom
                    viewport
                  </p>
                  <Code>pre-post url1 url2 --mobile</Code>
                  <Code>pre-post url1 url2 --size 1920x1080</Code>
                </div>

                <div className="space-y-2">
                  <p className="text-sm">Capture the entire scrollable page</p>
                  <Code>pre-post url1 url2 --full</Code>
                </div>

                <div className="space-y-2">
                  <p className="text-sm">
                    Output a markdown table for PR descriptions
                  </p>
                  <Code>pre-post url1 url2 --markdown</Code>
                </div>

                <div className="space-y-2">
                  <p className="text-sm">
                    Use existing images instead of capturing URLs
                  </p>
                  <Code>pre-post before.png after.png</Code>
                </div>

                <div className="space-y-2">
                  <p className="text-sm">Save to a custom location</p>
                  <Code>pre-post url1 url2 --output ./screenshots</Code>
                </div>

                <div className="space-y-2">
                  <p className="text-sm">
                    Upload to a custom image storage service
                  </p>
                  <Code>pre-post url1 url2 --upload-url my-s3-endpoint</Code>
                  <p className="text-sm mt-3">
                    By default, images are uploaded to{" "}
                    <a
                      href="https://0x0.st"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded-sm"
                    >
                      0x0.st
                    </a>
                    . For heavy usage or sensitive captures, use your own upload
                    handler.
                  </p>
                </div>
              </div>
            </details>
          </section>
        </div>

        {/* Acknowledgements */}
        <div className="max-w-[640px] mx-auto px-4 sm:px-6 mt-10 sm:mt-16 pt-6 sm:pt-8">
          <section className="space-y-1">
            <p className="text-xs text-neutral-400">Acknowledgements</p>
            <p className="text-xs text-neutral-400">
              Built on{" "}
              <a
                href="https://github.com/vercel-labs/before-and-after"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded-sm"
              >
                before-and-after
              </a>
              {" "}by{" "}
              <a
                href="https://x.com/jamesvclements"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded-sm"
              >
                James Clements
              </a>
              {" "}at{" "}
              <a
                href="https://github.com/vercel-labs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded-sm"
              >
                Vercel Labs
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
