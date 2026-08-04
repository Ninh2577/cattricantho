// utils/schema-validator.js

export class SchemaValidator {
  /**
   * Validate toàn bộ mảng schema (đã lấy ra từ @graph)
   * Trả về danh sách errors, warnings
   */
  static validate(schemas, pageUrl) {
    const results = {
      errors: [],
      warnings: [],
      stats: {
        total: schemas.length,
        types: schemas.map(s => Array.isArray(s["@type"]) ? s["@type"].join(', ') : s["@type"])
      }
    };

    schemas.forEach(schema => {
      this.validateSchema(schema, pageUrl, results);
    });

    return results;
  }

  static validateSchema(schema, pageUrl, results) {
    if (!schema["@type"]) {
      results.errors.push(`[${pageUrl}] Schema thiếu @type`);
      return;
    }

    if (!schema["@id"]) {
      results.warnings.push(`[${pageUrl}] Schema ${schema["@type"]} thiếu @id để liên kết Entity.`);
    }

    // Validate absolute URL
    if (schema.url && !schema.url.startsWith('http')) {
      results.errors.push(`[${pageUrl}] Schema ${schema["@type"]} có url không phải tuyệt đối (Absolute URL): ${schema.url}`);
    }

    const type = Array.isArray(schema["@type"]) ? schema["@type"][0] : schema["@type"];

    switch (type) {
      case 'Article':
      case 'MedicalWebPage':
        if (!schema.headline) results.errors.push(`[${pageUrl}] Article thiếu headline (Required)`);
        if (!schema.author) results.errors.push(`[${pageUrl}] Article thiếu author (E-E-A-T Critical)`);
        if (!schema.reviewedBy) results.warnings.push(`[${pageUrl}] Article nên có reviewedBy để tăng E-E-A-T`);
        if (!schema.image) results.errors.push(`[${pageUrl}] Article thiếu image (Required by Google)`);
        break;
      
      case 'Organization':
      case 'MedicalClinic':
        if (!schema.logo) results.errors.push(`[${pageUrl}] Organization/Clinic thiếu logo (Required)`);
        if (!schema.contactPoint && !schema.telephone) results.warnings.push(`[${pageUrl}] Organization thiếu contactPoint/telephone`);
        break;

      case 'Person':
        if (!schema.name) results.errors.push(`[${pageUrl}] Person thiếu name`);
        if (!schema.jobTitle) results.warnings.push(`[${pageUrl}] Person nên có jobTitle (vd: Doctor)`);
        break;
        
      case 'ImageObject':
        if (!schema.url) results.errors.push(`[${pageUrl}] ImageObject thiếu url`);
        break;
    }
  }
}
