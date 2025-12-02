export const searchOneDriveCodegenTemplate = `// Search OneDrive
const results = await oneDrive.search({
  query: "{{query}}",
  folderPath: "{{folderPath}}",
  maxResults: {{maxResults}},
});`;
