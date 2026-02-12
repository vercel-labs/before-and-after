import React from "react"
import type { Metadata } from "next"
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import localFont from "next/font/local"

import "./globals.css"

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
})

const vanillaCream = localFont({
  src: "./fonts/VanillaCreamOx-Regular.otf",
  variable: "--font-vanilla-cream",
})

const biroScript = localFont({
  src: "./fonts/Biro_Script_reduced.otf",
  variable: "--font-biro-script",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://site-puce-rho.vercel.app"),
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
    icon: "/icon",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${vanillaCream.variable} ${biroScript.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
