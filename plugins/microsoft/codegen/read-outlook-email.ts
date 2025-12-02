export const readOutlookEmailCodegenTemplate = `// Read Outlook mail
const messages = await outlook.read({
  query: "{{query}}",
  folder: "{{folder}}",
  maxResults: {{maxResults}},
});`;
