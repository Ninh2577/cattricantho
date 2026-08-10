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

    // 2. Graph Integrity Validation (Cross-check)
    this.validateGraphIntegrity(schemas, pageUrl, results);

    return results;
  }

  static validateGraphIntegrity(schemas, pageUrl, results) {
    // 1. Collect all declared @id
    const declaredIds = new Map();
    schemas.forEach(schema => {
      if (schema["@id"]) {
        if (declaredIds.has(schema["@id"])) {
          results.errors.push(`[${pageUrl}] DUPLICATE @id: ${schema["@id"]}`);
        }
        declaredIds.set(schema["@id"], schema["@type"]);
      }
    });

    // 2. Deep scan for all {"@id": "..."} references and check their existence/type
    const checkReferences = (obj, parentKey, parentSchema) => {
      if (!obj || typeof obj !== 'object') return;
      
      if (obj["@id"] && Object.keys(obj).length === 1) {
        // It's a reference!
        const refId = obj["@id"];
        if (!declaredIds.has(refId)) {
          results.errors.push(`[${pageUrl}] GRAPH INTEGRITY ERROR: Tham chiếu mồ côi (dangling @id) tại '${parentKey}' trỏ đến '${refId}' không tồn tại trong @graph.`);
        } else {
          // Type Compatibility Check
          const targetType = declaredIds.get(refId);
          this.validateTypeCompatibility(parentSchema["@type"], parentKey, targetType, refId, pageUrl, results);
        }
      } else {
        // Recurse
        for (const key in obj) {
          if (key !== '@context' && key !== '@graph') {
            if (Array.isArray(obj[key])) {
              obj[key].forEach(item => checkReferences(item, key, parentSchema));
            } else {
              checkReferences(obj[key], key, parentSchema);
            }
          }
        }
      }
    };

    schemas.forEach(schema => {
      checkReferences(schema, null, schema);
    });
  }

  static validateTypeCompatibility(sourceType, propKey, targetType, targetId, pageUrl, results) {
    const isTargetType = (expectedTypes) => {
      const targets = Array.isArray(targetType) ? targetType : [targetType];
      return targets.some(t => expectedTypes.includes(t));
    };
    
    const isSourceType = (expectedTypes) => {
      const sources = Array.isArray(sourceType) ? sourceType : [sourceType];
      return sources.some(t => expectedTypes.includes(t));
    };

    if (propKey === 'author' && !isTargetType(['Person', 'Organization'])) {
      results.errors.push(`[${pageUrl}] SCHEMA TYPE ERROR: 'author' trỏ đến ${targetId} nhưng entity này không phải Person hoặc Organization.`);
    }
    if (propKey === 'reviewedBy' && !isTargetType(['Person', 'Organization'])) {
      results.errors.push(`[${pageUrl}] SCHEMA TYPE ERROR: 'reviewedBy' trỏ đến ${targetId} nhưng entity này không phải Person hoặc Organization.`);
    }
    if (propKey === 'publisher' && !isTargetType(['Organization'])) {
      results.errors.push(`[${pageUrl}] SCHEMA TYPE ERROR: 'publisher' trỏ đến ${targetId} nhưng entity này không phải Organization.`);
    }
    if (propKey === 'mainEntityOfPage' && isSourceType(['Article']) && !isTargetType(['WebPage'])) {
      results.errors.push(`[${pageUrl}] SCHEMA TYPE ERROR: Article 'mainEntityOfPage' phải trỏ đến WebPage.`);
    }
    if (propKey === 'isPartOf' && isSourceType(['WebPage']) && !isTargetType(['WebSite'])) {
      results.errors.push(`[${pageUrl}] SCHEMA TYPE ERROR: WebPage 'isPartOf' phải trỏ đến WebSite.`);
    }
    if (propKey === 'primaryImageOfPage' && !isTargetType(['ImageObject'])) {
      results.errors.push(`[${pageUrl}] SCHEMA TYPE ERROR: 'primaryImageOfPage' phải trỏ đến ImageObject.`);
    }
    if (propKey === 'image' && !isTargetType(['ImageObject'])) {
      results.errors.push(`[${pageUrl}] SCHEMA TYPE ERROR: 'image' phải trỏ đến ImageObject.`);
    }
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
