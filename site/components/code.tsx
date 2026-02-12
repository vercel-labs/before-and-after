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
    <div className={`relative flex items-center border border-neutral-200 rounded-lg px-4 py-2.5 text-[13px] sm:text-[14px] ${className}`}>
      <div
        className="flex-1 min-w-0 overflow-x-auto [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!bg-transparent [&_pre]:whitespace-pre [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-neutral-200 [&::-webkit-scrollbar-track]:bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="flex-shrink-0 ml-3">
        <CopyButton text={value} />
      </div>
    </div>
  )
}
