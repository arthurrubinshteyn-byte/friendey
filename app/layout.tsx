import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Friendey',
  description: 'The simple weekly planner for people who are done juggling five apps. One clean space to plan your week, capture your thoughts, and live deliberately.',
  icons: {
    icon: '/apple-touch-icon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Friendey',
    description: 'The simple weekly planner for people who are done juggling five apps.',
    url: 'https://friendey.com',
    siteName: 'Friendey',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
      </head>
      <body className="bg-[#F7F6F3] min-h-screen font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
