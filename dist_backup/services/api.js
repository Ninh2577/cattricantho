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

  async getAllArticles() {
    const query = `
      query GetAllArticles {
        articles(orderBy: ngayDang_DESC, first: 100) {
          id
          title
          slug
          anh {
            url
          }
          noiDung {
            html
            text
          }
          tomtat
          tacGia
          createdBy {
            name
          }
          ngayDang
          thoiGianDoc
          danhMuc
          seoTitle
          seoDescription
        }
      }
    `;
    const data = await this.fetchGraphQL(query);
    return data?.articles || [];
  }

  async getLatestArticles(limit = 10) {
    const query = `
      query GetLatestArticles($limit: Int!) {
        articles(orderBy: ngayDang_DESC, first: $limit) {
          id
          title
          slug
          tomtat
          anh { url }
          danhMuc
          tacGia
          createdBy { name }
          ngayDang
        }
      }
    `;
    const data = await this.fetchGraphQL(query, { limit });
    return data?.articles || [];
  }

  async getArticleBySlug(slug) {
    const query = `
      query GetArticleBySlug($slug: String!) {
        article(where: { slug: $slug }) {
          id
          title
          slug
          tomtat
          noiDung { html }
          anh { url }
          danhMuc
          tacGia
          createdBy { name }
          ngayDang
          thoiGianDoc
          seoTitle
          seoDescription
        }
      }
    `;
    const data = await this.fetchGraphQL(query, { slug });
    return data?.article || null;
  }
}

export const apiService = new HygraphService();
