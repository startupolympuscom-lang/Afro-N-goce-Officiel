const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'stores');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('upstashStorage')) {
    // Add import
    content = content.replace(
      "import { persist }",
      "import { persist, createJSONStorage }"
    );
    content = content.replace(
      "import { persist,",
      "import { persist, createJSONStorage,"
    );
    
    if (!content.includes('createJSONStorage')) {
        content = content.replace(
            "import { persist",
            "import { persist, createJSONStorage"
        );
    }

    content = content.replace(
      "import { create } from 'zustand';",
      "import { create } from 'zustand';\nimport { upstashStorage } from '../lib/upstash';"
    );
    
    // Replace name: '...' with name: '...', storage: createJSONStorage(() => upstashStorage)
    content = content.replace(
      /name:\s*'([^']+)'\s*}/g,
      "name: '$1', storage: createJSONStorage(() => upstashStorage) }"
    );
    content = content.replace(
      /name:\s*'([^']+)',\n\s*}/g,
      "name: '$1',\n      storage: createJSONStorage(() => upstashStorage),\n    }"
    );
    
    fs.writeFileSync(filePath, content);
  }
}
