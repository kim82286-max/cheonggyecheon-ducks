export const metadata = {
  title: '청계천 아기오리 🐥',
  description: '청계천 아기오리 실시간 위치 제보 & 트래커',
  manifest: '/manifest.json',
  themeColor: '#2d6a4f',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '아기오리',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body style={{ margin: 0, background: '#f5f9f7' }}>{children}</body>
    </html>
  )
}
