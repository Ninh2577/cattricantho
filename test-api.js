import { apiService } from './services/api.js';

async function test() {
  try {
    const articles = await apiService.getAllArticles();
    console.log("Found articles:", articles.length);
    console.log(JSON.stringify(articles, null, 2));
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
