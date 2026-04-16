import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Boltline Test Dashboard',
  description: 'Hardware test workflow management for Stoke Space manufacturing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
