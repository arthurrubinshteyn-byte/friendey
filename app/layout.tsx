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
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%231C1C1A'/><text x='50' y='72' font-size='58' font-weight='700' text-anchor='middle' fill='%23F0EDE6' font-family='sans-serif'>f</text></svg>" />
      </head>
      <body className="bg-[#F7F6F3] min-h-screen font-sans">
        {children}
      </body>
    </html>
  )
}
