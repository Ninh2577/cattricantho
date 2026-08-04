import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SchemaMapper } from './utils/schema-mapper.js';
import { SchemaFactory } from './utils/schema.js';
import { SchemaValidator } from './utils/schema-validator.js';
import { SEOManager } from './utils/seo.js';
import { siteConfig } from './config/site.config.js';
import { clinicConfig } from './config/clinic.config.js';

const fileSlug = 'index';
let pageType = 'home';
const pageData = { title: fileSlug, slug: fileSlug }; 
const schemaStrategy = SchemaMapper.getStrategy(pageType);
const pageSchemas = [];

if (schemaStrategy.includes('Organization')) pageSchemas.push(SchemaFactory.generateOrganization());
if (schemaStrategy.includes('WebSite')) pageSchemas.push(SchemaFactory.generateWebSite());
if (schemaStrategy.includes('MedicalClinic')) pageSchemas.push(SchemaFactory.generateMedicalClinic());
if (schemaStrategy.includes('WebPage')) pageSchemas.push(SchemaFactory.generateWebPage(`${SchemaFactory.getBaseUrl()}/${fileSlug}`, fileSlug, ''));

const pageUrl = `${SchemaFactory.getBaseUrl()}/${fileSlug}`;
const validationResults = SchemaValidator.validate(pageSchemas, pageUrl);

const tags = SEOManager.generateMetaTags(pageData, pageSchemas);
fs.writeFileSync('test-tags.html', tags);
console.log('Tags generated');
