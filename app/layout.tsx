import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Friendey',
  description: 'The simple weekly planner for people who are done juggling five apps. One clean space to plan your week, capture your thoughts, and live deliberately.',
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
        <link rel="icon" href="apple-touch-icon.png" sizes="any" />
      </head>
      <body className="bg-[#F7F6F3] min-h-screen font-sans">
        {children}
      </body>
    </html>
  )
}
