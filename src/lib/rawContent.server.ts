import fs from 'node:fs/promises';

export async function listMarkdownFiles(dir: string): Promise<string[]> {
  const markdownFiles: string[] = [];
  const files = await fs.readdir(dir);

  for (const file of files) {
    const filePath = `${dir}/${file}`
    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      const subDirFiles = await listMarkdownFiles(filePath);
      markdownFiles.push(...subDirFiles);
    } else {
      if (filePath.endsWith('.md')) {
        markdownFiles.push(filePath);
      }
    }
  }

  return markdownFiles;
}

export const allMdFiles = await listMarkdownFiles('./content')

export function getContent(slug:string) {
  return allMdFiles.find(f => f.endsWith(`/${slug}.md`))
}
