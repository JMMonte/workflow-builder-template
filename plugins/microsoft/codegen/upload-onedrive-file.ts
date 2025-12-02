export const uploadOneDriveFileCodegenTemplate = `// Upload to OneDrive
const file = await oneDrive.upload({
  fileUrl: "{{fileUrl}}",
  folderPath: "{{folderPath}}",
});`;
