import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.wizemory.com'
  const now  = new Date()

  return [
    { url: base,                                                    lastModified: now, changeFrequency: 'weekly',  priority: 1   },
    { url: `${base}/pricing`,                                       lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/demo`,                                          lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/vs`,                                            lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/team`,                                          lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/about`,                                         lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog`,                                          lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/blog/why-you-forget-everything-you-read`,       lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/building-a-second-brain-guide`,            lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/knowledge-management-tools-comparison`,    lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/spaced-repetition-for-knowledge-workers`,  lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tools/summarize-youtube-video`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/tools/summarize-article`,                       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/tools/ai-note-taking`,                          lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/tools/second-brain-app`,                        lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/tools/remember-what-you-read`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/changelog`,                                     lastModified: now, changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${base}/privacy`,                                       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/terms`,                                         lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]
}
