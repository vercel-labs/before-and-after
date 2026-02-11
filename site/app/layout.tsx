import React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import localFont from "next/font/local"

import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const vanillaCream = localFont({
  src: "./fonts/VanillaCreamOx-Regular.otf",
  variable: "--font-vanilla-cream",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://github.com/juangadm/pre-post"),
  alternates: {
    canonical: "/",
  },
  title: "pre-post",
  description: "Visual diff tool for PRs — captures before/after screenshots of web pages. Use as a Claude Code skill or from the CLI.",
  openGraph: {
    title: "pre-post",
    description: "Visual diff tool for PRs — captures before/after screenshots of web pages. Use as a Claude Code skill or from the CLI.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "pre-post",
    description: "Visual diff tool for PRs — captures before/after screenshots of web pages. Use as a Claude Code skill or from the CLI.",
  },
  icons: {
    icon: "/pre-post/icon",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} ${vanillaCream.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
