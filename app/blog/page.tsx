import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'WizeMory Blog — Knowledge Management, Second Brain, and Learning',
  description: 'Guides, tips, and insights on building a second brain, managing knowledge, and making the most of everything you read.',
}

const POSTS = [
  {
    slug: 'why-you-forget-everything-you-read',
    title: 'Why you forget 90% of everything you read (and how to fix it)',
    excerpt: 'The forgetting curve is brutal. Within 7 days you lose most of what you read. Here is the science behind why, and the system that actually works.',
    date: 'Apr 10, 2025',
    readTime: '5 min read',
    tag: 'Learning science',
  },
  {
    slug: 'building-a-second-brain-guide',
    title: 'The complete guide to building a second brain in 2025',
    excerpt: 'A practical, step-by-step guide to capturing, organising, and using everything you learn — without turning it into a second job.',
    date: 'Apr 5, 2025',
    readTime: '8 min read',
    tag: 'Guide',
  },
  {
    slug: 'knowledge-management-tools-comparison',
    title: 'Notion vs Obsidian vs WizeMory: which is right for you?',
    excerpt: 'We compared the three most popular knowledge management tools across five dimensions. The results might surprise you.',
    date: 'Mar 28, 2025',
    readTime: '6 min read',
    tag: 'Comparison',
  },
  {
    slug: 'spaced-repetition-for-knowledge-workers',
    title: 'How spaced repetition can double what you remember from reading',
    excerpt: 'Spaced repetition is used by medical students to memorise thousands of facts. Here is how to apply the same technique to your everyday reading.',
    date: 'Mar 20, 2025',
    readTime: '4 min read',
    tag: 'Productivity',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-ink-50">
      <nav className="border-b border-ink-100 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-ink-900">Wize<span className="text-violet-500">Mory</span></Link>
        <Link href="/auth/sign-up" className="px-4 py-2 bg-ink-900 text-ink-50 rounded-lg text-sm font-medium hover:bg-ink-800 transition-colors">Start free →</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="font-display text-5xl text-ink-900 mb-3">WizeMory Blog</h1>
          <p className="text-ink-500 text-lg">Guides and insights on knowledge management, learning, and building your second brain.</p>
        </div>

        <div className="space-y-6">
          {POSTS.map(post => (
            <article key={post.slug} className="bg-white border border-ink-100 rounded-2xl p-6 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium px-2.5 py-1 bg-violet-50 text-violet-700 rounded-full">{post.tag}</span>
                <span className="text-xs text-ink-400">{post.date} · {post.readTime}</span>
              </div>
              <h2 className="font-display text-2xl text-ink-900 mb-2 leading-tight">
                <Link href={`/blog/${post.slug}`} className="hover:text-violet-700 transition-colors">{post.title}</Link>
              </h2>
              <p className="text-ink-500 text-sm leading-relaxed">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
