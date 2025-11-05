import { RecursiveCharacterTextSplitter } from '../langchain/textSplitter.js';
import { words } from '../utils/stringUtils.js';

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 900, chunkOverlap: 150 });

export async function chunkText(text) {
  const documents = await splitter.createDocuments([text]);
  return documents.map((doc, index) => {
    const chunkWords = words(doc.pageContent);
    return {
      id: `${index + 1}`,
      index,
      text: doc.pageContent,
      wordCount: chunkWords.length
    };
  });
}
