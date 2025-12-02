export const createSharePointPageCodegenTemplate = `// Create SharePoint page
const page = await sharePoint.createPage({
  siteId: "{{siteId}}",
  title: "{{title}}",
  content: "{{content}}",
});`;
