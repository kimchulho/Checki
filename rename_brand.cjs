const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/services/securityService.ts',
  'src/App.tsx',
  'src/i18n.ts',
  'src/components/AdminLogin.tsx',
  'public/manifest.json',
  'server.ts',
  'test_db.ts',
  'index.html',
  'metadata.json'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/Checky/g, 'Checki');
    content = content.replace(/checky/g, 'checki');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
