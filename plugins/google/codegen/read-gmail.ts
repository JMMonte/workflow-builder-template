export const readGmailCodegenTemplate = `// Read Gmail
const messages = await gmail.read({
  query: "{{query}}",
  maxResults: {{maxResults}},
});`;
