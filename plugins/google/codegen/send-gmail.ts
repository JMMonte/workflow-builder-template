export const sendGmailCodegenTemplate = `// Send Gmail
const response = await gmail.sendEmail({
  to: "{{to}}",
  subject: "{{subject}}",
  body: "{{body}}",
});`;
