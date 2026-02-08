import { codeToHtml } from 'shiki'
import { CopyButton } from './copy-button'

interface CodeProps {
  children: string
  lang?: string
  className?: string
}

export async function Code({ children, lang = 'bash', className = '' }: CodeProps) {
  const value = children.trim()
  const html = await codeToHtml(value, {
    lang,
    theme: 'min-light',
  })

  return (
    <div className="relative -mr-4 sm:mr-0 w-fit max-w-[calc(100%+1rem)] sm:max-w-full">
      <div
        className={`bg-neutral-50 rounded-lg px-2.5 sm:px-3 sm:pr-14 py-1.5 sm:py-2 text-[12px] sm:text-[14px] overflow-x-auto [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!pr-11 sm:[&_pre]:!pr-0 [&_code]:!bg-transparent ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
        <div className="pointer-events-auto flex h-full items-center rounded-r-lg bg-gradient-to-l from-neutral-50 via-neutral-50/90 to-transparent pl-6 sm:pl-8 pr-2">
          <CopyButton text={value} />
        </div>
      </div>
    </div>
  )
}
