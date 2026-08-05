import { apiService } from './services/api.js';

async function test() {
  const articles = await apiService.getAllArticles();
  console.log(JSON.stringify(articles[0], null, 2));
}

test();
