import { apiService } from './services/api.js';

async function check() {
  try {
    const res = await apiService.getAllArticles();
    console.log("Articles:", res.length);
    if(res.length > 0) {
      console.log("First article categories:", res[0].danhMuc);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
check();
