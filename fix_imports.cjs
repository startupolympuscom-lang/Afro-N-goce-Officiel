const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'stores');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(
    "import { persist, createJSONStorage, createJSONStorage }",
    "import { persist, createJSONStorage }"
  );
  
  fs.writeFileSync(filePath, content);
}
