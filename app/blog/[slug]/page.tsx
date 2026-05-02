import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const POSTS: Record<string, { title: string; description: string; date: string; readTime: string; tag: string; content: string }> = {
  'why-you-forget-everything-you-read': {
    title: 'Why you forget 90% of everything you read (and how to fix it)',
    description: 'The forgetting curve is brutal. Within 7 days you lose most of what you read. Here is the science and the fix.',
    date: 'April 10, 2025', readTime: '5 min read', tag: 'Learning science',
    content: `<h2>The brutal truth about your reading habit</h2>
<p>You read an insightful article on Monday. By Friday, you remember the headline and maybe one stat. By next month, you've forgotten it completely. This isn't laziness — it's the way human memory actually works.</p>
<p>In 1885, Hermann Ebbinghaus mapped the "forgetting curve" — the exponential rate at which we lose new information. Without active reinforcement, we forget roughly 70% of new information within 24 hours, and 90% within a week.</p>
<h2>Why your highlights don't help</h2>
<p>Most people try to fix this with highlighting. But highlighting creates the illusion of learning without the substance. You see the yellow text, you think "I know this," and you move on. The actual information hasn't been encoded any more deeply.</p>
<p>The only thing that works is what psychologists call "retrieval practice" — actively pulling information back out of your memory, ideally with some effort involved.</p>
<h2>Spaced repetition: the science-backed fix</h2>
<p>Spaced repetition is the practice of reviewing information at gradually increasing intervals. Review something today. Then in 3 days. Then in a week. Then in a month. Each review right before you'd normally forget it strengthens the memory trace dramatically.</p>
<p>Medical students use this technique to memorise thousands of facts. Language learners use it to retain vocabulary. You can use it to retain everything you read.</p>
<h2>How WizeMory applies this automatically</h2>
<p>WizeMory's review queue uses the SM-2 spaced repetition algorithm. Every item you save is scheduled for review at the optimal time. You rate how well you remembered it, and the algorithm adjusts your next review accordingly — without any manual flashcard creation.</p>`,
  },
  'building-a-second-brain-guide': {
    title: 'The complete guide to building a second brain in 2025',
    description: 'A practical step-by-step guide to capturing, organising, and using everything you learn — without it becoming a second job.',
    date: 'April 5, 2025', readTime: '8 min read', tag: 'Guide',
    content: `<h2>What is a second brain?</h2>
<p>A "second brain" is a personal knowledge management system — a digital extension of your memory where you store ideas, research, and insights so you can actually use them later.</p>
<h2>The problem with most second brain setups</h2>
<p>The paradox of most second brain systems is that building and maintaining them requires more effort than the value they return. Notion databases collapse under their own complexity. Obsidian vaults become digital attics. The core mistake is treating "organisation" as the goal — it's just a means to an end.</p>
<h2>The capture phase: make it effortless</h2>
<p>Capture should take less than 10 seconds or you won't do it consistently. Browser extension for articles, voice memos for ideas on the go, quick note input for thoughts. The bar for capture should be nearly zero.</p>
<h2>The processing phase: let AI do it</h2>
<p>This is where AI changes everything. Manually processing every captured item — writing titles, adding tags, linking notes, summarising — is what kills most second brain systems. With WizeMory, this phase is completely automatic.</p>
<h2>The retrieval phase: actually use what you know</h2>
<p>The real measure of a second brain is whether you can get the right knowledge at the right time. This requires semantic search (finding by meaning) and an AI assistant that answers questions from your specific knowledge — not the internet's generic answers.</p>`,
  },
  'knowledge-management-tools-comparison': {
    title: 'Notion vs Obsidian vs WizeMory: which is right for you?',
    description: 'We compared the three most popular knowledge management tools across five key dimensions. The results might surprise you.',
    date: 'March 28, 2025', readTime: '6 min read', tag: 'Comparison',
    content: `<h2>The landscape in 2025</h2>
<p>Three tools dominate personal knowledge management: Notion (flexible workspace), Obsidian (local markdown with powerful linking), and WizeMory (AI-native with automatic processing).</p>
<h2>Notion</h2>
<p>Best for teams needing shared workspaces and structured databases. Not ideal for personal knowledge capture — too heavy, no automatic processing, limited Q&A capabilities.</p>
<h2>Obsidian</h2>
<p>Best for power users who want full local control and enjoy customising their setup. Steep learning curve, no automatic processing, mobile capture is clunky.</p>
<h2>WizeMory</h2>
<p>Best for knowledge workers who want to remember what they read without effort. AI processes every item automatically on save — no manual tagging, linking, or summarising required. Not ideal for complex project management or users who want local-only storage.</p>
<h2>The key differentiator</h2>
<p>The single biggest difference is AI processing on save. Notion and Obsidian require you to process every item manually. WizeMory does it automatically. For most people, this saves 30–60 minutes per week and dramatically increases how much knowledge they actually retain and use.</p>`,
  },
  'spaced-repetition-for-knowledge-workers': {
    title: 'How spaced repetition can double what you remember from reading',
    description: 'Spaced repetition is used by medical students to memorise thousands of facts. Here\'s how to apply it to everyday reading.',
    date: 'March 20, 2025', readTime: '4 min read', tag: 'Productivity',
    content: `<h2>The memory problem</h2>
<p>Knowledge workers read constantly and forget almost everything within days. This isn't a personal failing — it's a fundamental property of human memory. Without reinforcement, memories decay exponentially.</p>
<h2>How medical students solve this</h2>
<p>Medical students need to memorise tens of thousands of facts. For decades, the gold standard solution has been spaced repetition software using algorithms like SM-2 that calculate the optimal review interval for each piece of information.</p>
<p>The core insight: review each item just before you'd naturally forget it. This "desirable difficulty" forces your brain to reconstruct the memory, making it much stronger. Intervals space out as memories consolidate: 1 day, 3 days, 7 days, 21 days, 60 days.</p>
<h2>The results</h2>
<p>Studies consistently show spaced repetition reduces forgetting by 70–90% compared to passive re-reading. The technique works equally well for language learning, general knowledge, and professional development.</p>
<h2>Applying it without creating flashcards</h2>
<p>The barrier for most people isn't willingness to review — it's the time to create flashcards. WizeMory eliminates this entirely. Every article you save becomes a reviewable item automatically. AI extracts the key insights. You rate how well you remembered them. The algorithm handles scheduling.</p>`,
  },
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = POSTS[params.slug]
  if (!post) return { title: 'Not found' }
  return {
    title: post.title, description: post.description,
    alternates: { canonical: `https://wizemory.com/blog/${params.slug}` },
    openGraph: { title: post.title, description: post.description, type: 'article' },
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = POSTS[params.slug]
  if (!post) notFound()

  return (
    <div className="min-h-screen bg-ink-50">
      <nav className="border-b border-ink-100 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-ink-900">Wize<span className="text-violet-500">Mory</span></Link>
        <Link href="/auth/sign-up" className="px-4 py-2 bg-ink-900 text-ink-50 rounded-lg text-sm font-medium hover:bg-ink-800 transition-colors">Start free →</Link>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/blog" className="text-sm text-violet-600 hover:text-violet-700 mb-8 inline-block transition-colors">← All posts</Link>
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs font-medium px-2.5 py-1 bg-violet-50 text-violet-700 rounded-full">{post.tag}</span>
          <span className="text-sm text-ink-400">{post.date} · {post.readTime}</span>
        </div>
        <h1 className="font-display text-4xl text-ink-900 mb-8 leading-tight">{post.title}</h1>
        <div className="prose-wizemory text-ink-700" dangerouslySetInnerHTML={{ __html: post.content }} />
        <div className="mt-12 p-6 bg-violet-50 border border-violet-100 rounded-2xl">
          <div className="font-medium text-violet-900 mb-2">Try WizeMory free</div>
          <p className="text-sm text-violet-700 mb-4">Save your first article in 30 seconds. AI does the rest.</p>
          <Link href="/auth/sign-up" className="inline-block px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">Start free →</Link>
        </div>
      </main>
    </div>
  )
}
