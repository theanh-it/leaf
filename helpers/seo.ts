/**
 * SEO Helper
 * Utility functions để generate SEO meta tags, Open Graph, Twitter Cards, và Structured Data
 */

export interface SEOData {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  siteName?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  locale?: string;
  alternateLocales?: string[];
  noindex?: boolean;
  nofollow?: boolean;
}

export interface StructuredData {
  '@context'?: string;
  '@type': string;
  [key: string]: any;
}

/**
 * Generate SEO meta tags object
 */
export function generateSEO(data: SEOData, baseUrl: string = ''): {
  title: string;
  description: string;
  meta: Record<string, string>;
  og: Record<string, string>;
  twitter: Record<string, string>;
  canonical: string;
  robots: string;
} {
  const url = data.url ? `${baseUrl}${data.url}` : baseUrl;
  const image = data.image 
    ? (data.image.startsWith('http') ? data.image : `${baseUrl}${data.image}`)
    : `${baseUrl}/og-default.jpg`;

  const meta: Record<string, string> = {
    description: data.description,
    'author': data.author || '',
    'viewport': 'width=device-width, initial-scale=1.0',
  };

  // Robots meta
  const robots: string[] = [];
  if (data.noindex) robots.push('noindex');
  if (data.nofollow) robots.push('nofollow');
  if (robots.length > 0) {
    meta.robots = robots.join(', ');
  }

  // Open Graph
  const og: Record<string, string> = {
    'og:title': data.title,
    'og:description': data.description,
    'og:image': image,
    'og:url': url,
    'og:type': data.type || 'website',
    'og:locale': data.locale || 'vi_VN',
  };

  if (data.siteName) {
    og['og:site_name'] = data.siteName;
  }

  if (data.type === 'article') {
    if (data.publishedTime) og['article:published_time'] = data.publishedTime;
    if (data.modifiedTime) og['article:modified_time'] = data.modifiedTime;
    if (data.author) og['article:author'] = data.author;
  }

  // Twitter Card
  const twitter: Record<string, string> = {
    'twitter:card': 'summary_large_image',
    'twitter:title': data.title,
    'twitter:description': data.description,
    'twitter:image': image,
  };

  return {
    title: data.title,
    description: data.description,
    meta,
    og,
    twitter,
    canonical: url,
    robots: robots.length > 0 ? robots.join(', ') : 'index, follow',
  };
}

/**
 * Generate JSON-LD structured data
 */
export function generateStructuredData(
  type: 'WebSite' | 'Article' | 'Product' | 'Organization' | 'BreadcrumbList',
  data: StructuredData
): string {
  const baseData: StructuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return JSON.stringify(baseData, null, 2);
}

/**
 * Generate Website structured data
 */
export function generateWebSiteStructuredData(baseUrl: string, siteName: string): string {
  return generateStructuredData('WebSite', {
    name: siteName,
    url: baseUrl,
  });
}

/**
 * Generate Article structured data
 */
export function generateArticleStructuredData(data: {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: { name: string; url?: string };
  publisher: { name: string; logo?: { url: string } };
}): string {
  return generateStructuredData('Article', {
    headline: data.headline,
    description: data.description,
    image: data.image,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    author: {
      '@type': 'Person',
      name: data.author.name,
      url: data.author.url,
    },
    publisher: {
      '@type': 'Organization',
      name: data.publisher.name,
      logo: data.publisher.logo ? {
        '@type': 'ImageObject',
        url: data.publisher.logo.url,
      } : undefined,
    },
  });
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>): string {
  return generateStructuredData('BreadcrumbList', {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

