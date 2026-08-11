// utils/html-parser.js

/**
 * A lightweight HTML parser for extracting and mutating H2/H3 tags
 * without using Regex, ensuring no disruption to other HTML elements.
 */
export class HtmlParser {
  static parseHeadingsAndInjectIds(html) {
    if (!html) return { html: '', headings: [] };
    
    let resultHtml = '';
    let currentIndex = 0;
    const headings = [];
    const usedIds = new Set();
    
    function generateSlug(text) {
      // Remove HTML tags inside the heading for text content
      let rawText = '';
      let insideTag = false;
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '<') insideTag = true;
        else if (text[i] === '>') insideTag = false;
        else if (!insideTag) rawText += text[i];
      }
      
      let slug = rawText
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      
      if (!slug) slug = 'section';
      
      let finalId = slug;
      let counter = 2;
      while (usedIds.has(finalId)) {
        finalId = `${slug}-${counter}`;
        counter++;
      }
      usedIds.add(finalId);
      return { id: finalId, text: rawText.trim() };
    }

    while (currentIndex < html.length) {
      const h2Idx = html.indexOf('<h2', currentIndex);
      const h3Idx = html.indexOf('<h3', currentIndex);
      
      let nextTag = null;
      let tagIdx = -1;
      
      if (h2Idx !== -1 && (h3Idx === -1 || h2Idx < h3Idx)) {
        nextTag = 'h2';
        tagIdx = h2Idx;
      } else if (h3Idx !== -1) {
        nextTag = 'h3';
        tagIdx = h3Idx;
      } else {
        resultHtml += html.substring(currentIndex);
        break;
      }
      
      // Append everything up to the tag
      resultHtml += html.substring(currentIndex, tagIdx);
      
      // Find the end of the opening tag
      const openTagEndIdx = html.indexOf('>', tagIdx);
      if (openTagEndIdx === -1) {
        resultHtml += html.substring(tagIdx);
        break;
      }
      
      // Extract the opening tag
      const openTag = html.substring(tagIdx, openTagEndIdx + 1);
      
      // Find the closing tag
      const closeTag = `</${nextTag}>`;
      const closeTagIdx = html.indexOf(closeTag, openTagEndIdx);
      if (closeTagIdx === -1) {
        // Unclosed tag, just append and continue
        resultHtml += openTag;
        currentIndex = openTagEndIdx + 1;
        continue;
      }
      
      // Extract inner HTML of the heading
      const innerHtml = html.substring(openTagEndIdx + 1, closeTagIdx);
      
      // Check if ID already exists
      let existingId = null;
      const idAttrIdx = openTag.indexOf('id="');
      if (idAttrIdx !== -1) {
        const idStart = idAttrIdx + 4;
        const idEnd = openTag.indexOf('"', idStart);
        if (idEnd !== -1) {
          existingId = openTag.substring(idStart, idEnd);
        }
      } else {
        const idAttrIdxSingle = openTag.indexOf("id='");
        if (idAttrIdxSingle !== -1) {
          const idStart = idAttrIdxSingle + 4;
          const idEnd = openTag.indexOf("'", idStart);
          if (idEnd !== -1) {
            existingId = openTag.substring(idStart, idEnd);
          }
        }
      }
      
      let headingId = existingId;
      let headingText = '';
      
      if (!headingId) {
        const slugData = generateSlug(innerHtml);
        headingId = slugData.id;
        headingText = slugData.text;
        
        // Inject ID into the tag
        const tagWithoutBracket = openTag.substring(0, openTag.length - 1);
        resultHtml += `${tagWithoutBracket} id="${headingId}">`;
      } else {
        usedIds.add(headingId);
        // We still need the text
        let rawText = '';
        let insideTag = false;
        for (let i = 0; i < innerHtml.length; i++) {
          if (innerHtml[i] === '<') insideTag = true;
          else if (innerHtml[i] === '>') insideTag = false;
          else if (!insideTag) rawText += innerHtml[i];
        }
        headingText = rawText.trim();
        resultHtml += openTag;
      }
      
      headings.push({
        level: nextTag === 'h2' ? 2 : 3,
        id: headingId,
        text: headingText
      });
      
      resultHtml += innerHtml + closeTag;
      currentIndex = closeTagIdx + closeTag.length;
    }
    
    return { html: resultHtml, headings };
  }

  static optimizeImages(html) {
    if (!html) return html;
    
    let isFirstImage = true;
    
    // Safely inject loading/decoding/fetchpriority attributes
    return html.replace(/<img([^>]*)>/gi, (match, p1) => {
      let attrs = p1;
      
      // Check if it's the very first image in the content
      if (isFirstImage) {
        if (!/fetchpriority\s*=\s*['"][^'"]*['"]/i.test(attrs)) {
          attrs += ' fetchpriority="high"';
        }
        if (!/loading\s*=\s*['"][^'"]*['"]/i.test(attrs)) {
          attrs += ' loading="eager"'; // LCP protection
        }
        isFirstImage = false;
      } else {
        if (!/loading\s*=\s*['"][^'"]*['"]/i.test(attrs)) {
          attrs += ' loading="lazy"';
        }
      }
      
      if (!/decoding\s*=\s*['"][^'"]*['"]/i.test(attrs)) {
        attrs += ' decoding="async"';
      }
      
      return `<img${attrs}>`;
    });
  }

  static generateTocHtml(headings) {
    if (!headings || headings.length === 0) return '';
    
    let tocHtml = '<nav class="skmd-toc" aria-label="Mục lục bài viết">\n<ul>\n';
    headings.forEach(h => {
      const className = h.level === 3 ? ' class="toc-h3"' : '';
      tocHtml += `<li${className}><a href="#${h.id}">${h.text}</a></li>\n`;
    });
    tocHtml += '</ul>\n</nav>';
    return tocHtml;
  }
}
