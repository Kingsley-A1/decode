import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const catalogPath = path.join(
  projectRoot,
  "components",
  "landing-pages",
  "landing-page-data.ts"
);
const prisma = new PrismaClient();

async function main() {
  const templates = loadFirstPartyTemplates();

  for (const template of templates) {
    await prisma.$transaction(async (transaction) => {
      const record = await transaction.landingPageTemplate.upsert({
        where: { key: template.key },
        create: toTemplateData(template),
        update: {
          ...toTemplateData(template),
          deletedAt: null,
        },
        select: { id: true },
      });

      await transaction.landingPageTemplateAsset.deleteMany({
        where: { templateId: record.id },
      });

      if (template.assetRequirements.length > 0) {
        await transaction.landingPageTemplateAsset.createMany({
          data: template.assetRequirements.map((asset, index) => ({
            templateId: record.id,
            uploadedAssetId: asset.uploadedAssetId,
            slot: asset.slot,
            label: asset.label,
            kind: asset.kind,
            required: asset.required,
            assetPath: asset.assetPath,
            alt: asset.alt,
            width: asset.width,
            height: asset.height,
            sortOrder: index,
          })),
        });
      }
    });
  }

  console.log(`Seeded ${templates.length} first-party landing page templates.`);
}

function loadFirstPartyTemplates() {
  const source = fs.readFileSync(catalogPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  }).outputText;
  const sandbox = {
    exports: {},
    require: (id) => {
      throw new Error(`Unexpected runtime import while loading catalog: ${id}`);
    },
  };

  vm.runInNewContext(output, sandbox, { filename: catalogPath });

  const templates = sandbox.exports.defaultLandingPageTemplatePresets;
  if (!Array.isArray(templates) || templates.length === 0) {
    throw new Error("No first-party landing page templates were found.");
  }

  return templates;
}

function toTemplateData(template) {
  const status = template.status ?? "published";

  return {
    key: template.key,
    type: template.type,
    label: template.label,
    description: template.description,
    category: template.category,
    industry: template.industry,
    status,
    source: "first_party",
    sortPriority: template.sortPriority,
    flags: template.flags,
    tags: template.tags,
    recommendedFor: template.recommendedFor,
    requiredFields: template.requiredFields,
    optionalFields: template.optionalFields,
    defaultTitle: template.defaultTitle,
    defaultContent: template.defaultContent,
    thumbnail: template.thumbnail,
    mobilePreview: template.mobilePreview,
    accessibilityNotes: template.accessibilityNotes,
    publishedAt: status === "published" ? new Date() : null,
    archivedAt: status === "archived" ? new Date() : null,
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
