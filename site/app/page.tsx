import { AutoPlayHero } from "@/components/hero";
import { Code } from "@/components/code";
import { Logo } from "@/components/logo";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#F3F3F3] text-neutral-500">
      <main className="py-10 sm:py-16">
        <div className="max-w-[540px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <a
              href="/before-and-after"
              className="text-neutral-800 hover:text-neutral-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded-sm"
            >
              <h1>
                <Logo />
              </h1>
            </a>
            <nav className="flex items-center gap-3 text-[13px] sm:text-sm">
              <span className="font-mono text-[11px] font-medium text-neutral-900">v0.1.0</span>
              <a
                href="https://jm.sv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded-sm"
              >
                jm.sv
              </a>
              <a
                href="https://github.com/vercel-labs/before-and-after"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-neutral-500 hover:text-neutral-800 transition-colors"
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
          <div className="mb-8 sm:mb-12 space-y-4">
            <p className="text-[14px] sm:text-[15px]">
              <span className="font-medium text-neutral-800">
                Put visual proof in every pull request.
              </span>{" "}
              Teach coding agents to show their work with before and after screenshots and video. Access protected
              preview deployments and format every capture for GitHub.
            </p>
            <Code>npx skills add vercel-labs/before-and-after#main</Code>
          </div>
        </div>

        <div className="mb-7 sm:mb-[52px] px-8 sm:px-0">
          <AutoPlayHero />
        </div>

        <div className="max-w-[540px] mx-auto px-4 sm:px-6">
          <p className="text-[14px] sm:text-[15px]">
            Browser navigation, authentication, and capture stay with the version-matched skills bundled in{" "}
            <code className="font-mono text-[13px] sm:text-[15px] text-[#6f42c1] bg-neutral-50 px-1 py-0.5 rounded shadow-[0_0_0_2px_#fafafa]">
              agent-browser
            </code>
            ; before and after formats the media and publishes it through{" "}
            <code className="font-mono text-[13px] sm:text-[15px] bg-neutral-50 px-1 py-0.5 rounded shadow-[0_0_0_2px_#fafafa]">
              <span className="text-[#6f42c1]">gh</span>{" "}
              <span className="text-[#2b5581]">--attach</span>
            </code>
            .
          </p>
        </div>

        <footer className="max-w-[540px] mx-auto px-4 sm:px-6 mt-6 sm:mt-12 pt-6 sm:pt-8 border-t border-neutral-100">
          <p className="text-sm text-neutral-500 flex flex-col items-center gap-2 sm:flex-row sm:justify-between w-full">
            <span>
              Uses{" "}
              <a
                href="https://agentbrowser.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-neutral-900 hover:underline"
              >
                agent-browser <span className="text-[9px] relative -top-px">▲</span>
              </a>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <a
                href="https://x.com/jamesvclements"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-neutral-900 hover:underline inline-flex items-center gap-1"
              >
                <img
                  src="https://avatars.githubusercontent.com/u/20052710?v=4"
                  alt=""
                  width={14}
                  height={14}
                  className="w-3.5 h-3.5 rounded-full"
                />
                James
              </a>
            </span>
          </p>
        </footer>
      </main>
    </div>
  );
}
