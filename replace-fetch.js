import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes("fetch('/api/")) {
    content = content.replace(/fetch\('\/api\//g, "fetch((import.meta.env.VITE_API_URL || '') + '/api/");
    changed = true;
  }
  
  if (content.includes("fetch(`/api/")) {
    content = content.replace(/fetch\(`\/api\//g, "fetch(`${import.meta.env.VITE_API_URL || ''}/api/");
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
