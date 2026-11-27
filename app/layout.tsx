import type { Metadata } from 'next'
import 'katex/dist/katex.min.css'
import './globals.css'
import { Sidebar } from '@/components/ui/Sidebar'

export const metadata: Metadata = {
  title: 'Mathground',
  description: 'University mathematics visualization and AI tutoring platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen overflow-hidden bg-gray-950 text-white">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </body>
    </html>
  )
}
