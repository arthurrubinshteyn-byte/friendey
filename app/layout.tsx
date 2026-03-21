import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Friendey',
  description: 'Your friendly daily planner',
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
      </body>
    </html>
  )
}
