import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, slug } = body;

    if (!topic || !slug) {
      return new Response(JSON.stringify({ error: 'Topic and slug are required' }), { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert SEO blog writer.' },
        { role: 'user', content: `Write a blog post on: ${topic}` }
      ]
    });
console.log("res--->>>" , response)
console.log("choise--->>>" , response.choices[0].message.content)
    const blogContent = response.choices[0].message.content || '';
    const blogFilePath = path.join(process.cwd(), 'app', 'blogs', `${slug}.tsx`);
    
    const blogPageContent = `
      import React from 'react';

      const ${slug.replace(/-/g, '_')}: React.FC = () => {
        return (
          <div>
            <h1>${topic}</h1>
            <p>${blogContent.replace(/\n/g, '<br />')}</p>
          </div>
        );
      };

      export default ${slug.replace(/-/g, '_')};
    `;
    
    fs.writeFileSync(blogFilePath, blogPageContent, 'utf-8');

    exec('git add . && git commit -m "Auto-generated blog: ' + slug + '" && git push', (error, stdout, stderr) => {
      if (error) {
        console.error(`Git Error: ${error.message}`);
        return new Response(JSON.stringify({ error: 'Git commit failed' }), { status: 500 });
      }
    });

    return new Response(JSON.stringify({ message: 'Blog created and pushed to Git!' }), { status: 200 });

  } catch (err) {
    console.error('Error generating blog:', err);
    return new Response(JSON.stringify({ error: 'Blog generation failed' }), { status: 500 });
  }
}
