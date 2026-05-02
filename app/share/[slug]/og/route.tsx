import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'edge'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const item = await prisma.item.findUnique({
    where: { publicSlug: params.slug, isPublic: true },
    select: { title: true, summary: true, tags: true, type: true },
  })

  if (!item) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%', height: '100%',
            background: '#1a1714',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ color: '#5a5449', fontSize: 24 }}>Not found</span>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  const typeEmoji: Record<string, string> = {
    ARTICLE: '📰', NOTE: '📝', VOICE: '🎙️', PDF: '📄', BOOKMARK: '🔖',
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          background: '#f7f6f2',
          display: 'flex', flexDirection: 'column',
          padding: '64px 72px',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 6,
          background: 'linear-gradient(90deg, #7340f5, #a98eff, #3d7e3d)',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 28, fontWeight: 600, color: '#1a1714', letterSpacing: '-1px' }}>
            Wize<span style={{ color: '#4f63f5' }}>Mory</span>
          </span>
          <span style={{ marginLeft: 16, fontSize: 13, color: '#928c82', fontFamily: 'sans-serif' }}>
            AI Second Brain
          </span>
        </div>

        {/* Type badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 24,
        }}>
          <span style={{ fontSize: 20 }}>{typeEmoji[item.type] ?? '📌'}</span>
          <span style={{ fontSize: 14, color: '#928c82', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {item.type.charAt(0) + item.type.slice(1).toLowerCase()}
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: item.title.length > 60 ? 40 : 52,
          color: '#1a1714',
          lineHeight: 1.15,
          margin: '0 0 28px',
          fontWeight: 400,
          maxWidth: '900px',
        }}>
          {item.title.length > 100 ? item.title.slice(0, 97) + '…' : item.title}
        </h1>

        {/* Summary */}
        {item.summary && (
          <p style={{
            fontSize: 20,
            color: '#5a5449',
            lineHeight: 1.6,
            margin: '0 0 36px',
            fontFamily: 'sans-serif',
            maxWidth: '860px',
            fontWeight: 400,
          }}>
            {item.summary.length > 160 ? item.summary.slice(0, 157) + '…' : item.summary}
          </p>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 'auto' }}>
            {item.tags.slice(0, 5).map(tag => (
              <span key={tag} style={{
                padding: '6px 14px',
                background: '#eeecea',
                borderRadius: 999,
                fontSize: 14,
                color: '#47413a',
                fontFamily: 'sans-serif',
                fontWeight: 500,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 32, borderTop: '1px solid #d9d6d0', marginTop: 32,
        }}>
          <span style={{ fontSize: 15, color: '#928c82', fontFamily: 'sans-serif' }}>
            wizemory.com
          </span>
          <span style={{
            fontSize: 14, color: '#7340f5', fontFamily: 'sans-serif', fontWeight: 500,
          }}>
            Build your second brain →
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
