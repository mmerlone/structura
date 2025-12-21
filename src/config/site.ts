import * as Sentry from '@sentry/nextjs'
import type { Metadata } from 'next'

export const SITE_CONFIG = {
  // Site URLs
  url: 'https://structura.vercel.app',

  // Site Info
  name: 'Structura',
  title: 'Structura',
  description: 'A comprehensive Next.js application with authentication, Material UI, and modern best practices',
  project_key: 'structura',

  // Author/Creator Info
  author: 'Marcio Merlone',

  // Social Images
  ogImage: {
    url: '/images/og-image.jpg',
    width: 1200,
    height: 630,
    alt: 'Structura - Modern Web Application',
    type: 'image/jpeg',
  },

  // SEO
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',

  // Social Media
  twitter: {
    card: 'summary_large_image' as const,
  },

  // Open Graph
  openGraph: {
    type: 'website' as const,
    locale: 'en_US' as const,
  },

  // Password requirements
  passwordRequirements: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
    specialChars: '!@#$%^&*(),.?:{}|<>',
  } as const,

  fixedHeader: true,
  fixedFooter: false,
  smallFooter: false,

  navigation: [
    { label: 'About', link: '/about' },
    { label: 'Sentry', link: '/sentry-example-page' },
    { label: 'GitHub', link: 'https://github.com/mmerlone/Structura', target: '_blank' },
  ],

  logging: null,
}

// Helper to generate full URL for a given path
export const fullUrl = (path: string): string => {
  return new URL(path, SITE_CONFIG.url).toString()
}

// Generate metadata object
export const getSiteMetadata = (): Metadata => ({
  metadataBase: new URL(SITE_CONFIG.url),
  title: SITE_CONFIG.title,
  description: SITE_CONFIG.description,
  keywords: ['Next.js', 'React', 'TypeScript', 'Material UI', 'Supabase', 'Authentication'],
  authors: [{ name: SITE_CONFIG.author }],
  creator: SITE_CONFIG.author,
  publisher: SITE_CONFIG.author,
  robots: SITE_CONFIG.robots,
  openGraph: {
    ...SITE_CONFIG.openGraph,
    url: '/',
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: fullUrl(SITE_CONFIG.ogImage.url),
        width: SITE_CONFIG.ogImage.width,
        height: SITE_CONFIG.ogImage.height,
        alt: SITE_CONFIG.ogImage.alt,
        type: SITE_CONFIG.ogImage.type,
      },
    ],
  },
  twitter: {
    ...SITE_CONFIG.twitter,
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: [
      {
        url: fullUrl(SITE_CONFIG.ogImage.url),
        width: SITE_CONFIG.ogImage.width,
        height: SITE_CONFIG.ogImage.height,
        alt: SITE_CONFIG.ogImage.alt,
      },
    ],
  },
  other: {
    ...Sentry.getTraceData(),
  },
})
