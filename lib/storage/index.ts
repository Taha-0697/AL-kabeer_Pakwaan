import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

export async function saveLocalFile(file: File, subDir = 'photos'): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const relativeDir = path.join(config.storage.uploadDir, subDir);
  const targetDir = path.join(process.cwd(), 'public', relativeDir);

  await fs.mkdir(targetDir, { recursive: true });

  const ext = path.extname(file.name) || '.jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
  const filePath = path.join(targetDir, fileName);

  await fs.writeFile(filePath, buffer);

  // Return web-accessible relative path to store in database
  return `/${relativeDir}/${fileName}`.replace(/\\/g, '/');
}

export async function deleteLocalFile(relativePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(process.cwd(), 'public', relativePath);
    await fs.unlink(fullPath);
    return true;
  } catch {
    return false;
  }
}
