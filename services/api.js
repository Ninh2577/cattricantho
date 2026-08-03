import { siteConfig } from '../config/site.config.js';

class HygraphService {
  constructor() {
    this.endpoint = siteConfig.cmsEndpoint;
  }

  async fetchGraphQL(query, variables = {}) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
        // Caching strategy (Phase 7 related)
        cache: 'force-cache'
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const json = await response.json();
      if (json.errors) {
        console.error('GraphQL Errors:', json.errors);
        throw new Error('GraphQL fetch failed');
      }

      return json.data;
    } catch (error) {
      console.error('Fetch Error:', error);
      // Fallback UI or Error Architecture trigger here
      return null;
    }
  }

  async getLatestArticles(limit = 10) {
    const query = `
      query GetLatestArticles($limit: Int!) {
        articles(orderBy: createdAt_DESC, first: $limit) {
          title
          slug
          excerpt
          featuredImage { url }
          category { name slug }
          author { name }
          createdAt
        }
      }
    `;
    return this.fetchGraphQL(query, { limit });
  }

  async getArticleBySlug(slug) {
    const query = `
      query GetArticleBySlug($slug: String!) {
        article(where: { slug: $slug }) {
          title
          content { html }
          seoTitle
          seoDescription
          medicalReviewer { name credentials }
          updatedAt
        }
      }
    `;
    return this.fetchGraphQL(query, { slug });
  }
}

export const apiService = new HygraphService();
