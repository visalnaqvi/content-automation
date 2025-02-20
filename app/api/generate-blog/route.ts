import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });



function updateDataFile(topic:string , slug:string , category:string , year:string){
  const dataFilePath = path.join(process.cwd(), 'data', 'blogs', year, category, 'data.ts');
  const dataDirPath = path.dirname(dataFilePath);

  try {
    let existingData: any[] = [];

    // Ensure the directory exists
    if (!fs.existsSync(dataDirPath)) {
      fs.mkdirSync(dataDirPath, { recursive: true });
    }

    // Ensure the file exists with an empty array if not present
    if (!fs.existsSync(dataFilePath)) {
      fs.writeFileSync(dataFilePath, 'export const data = [];', 'utf-8');
    }

    // Read the existing data.ts file
    const fileContent = fs.readFileSync(dataFilePath, 'utf-8');

    // Extract the array from the file
    const match = fileContent.match(/export\s+const\s+data\s*=\s*(\[[\s\S]*?\]);/);
    if (match) {
      existingData = eval(match[1]); // Convert the extracted array string to an actual array
    }

    // Generate new blog entry
    const newEntry = {
      date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
      year,
      category,
      id: existingData.length, // Index as ID
      url: `/blogs/${year}/${category}/${slug}`, // Construct blog URL
      title: topic, // Title from request
      description: `A detailed blog about ${topic} covering key insights and important information.`,
      img: `/images/blogs/${slug}.jpg` // Assuming an image path
    };

    // Append new entry
    existingData.push(newEntry);

    // Convert array back to TypeScript format
    const updatedContent = `export const data = ${JSON.stringify(existingData, null, 2)};`;

    // Write updated content back to data.ts
    fs.writeFileSync(dataFilePath, updatedContent, 'utf-8');

    console.log('Updated data.ts file successfully');
  } catch (error) {
    console.error('Error updating data.ts:', error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, 
      slug , 
      category , 
      year  , 
      keyword , 
      wordLength , 
      audience , 
      numberOfSubheading , 
      contentPara,
      contentWords,
    note} = body;

    // if (!topic || !slug) {
    //   return new Response(JSON.stringify({ error: 'Topic and slug are required' }), { status: 400 });
    // }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are an skill full experienced professional and expertise in ${keyword}.` },
        { role: 'user', content: `Your goal is to Write a blog post with minimum ${wordLength} words on topic "${topic}" with the targeted keyword "${keyword}" for audience of "${audience}" and use very human tone to include such keywords and content in this blog post that it should help my education website to improve its ranking for the targeted keyword.

Give the blog a suitable title that should follow all the guidelines for a SEO optimised title.
Keep the length of the title with the the seo suggested title lengths and the include the targeted keywords.

Include minimum ${numberOfSubheading} of sub headings in the blog post that all should be SEO optimised and should have good descriptive content the minimum ${contentPara} paragraphs of ${contentWords} words each and not just small pointers. I want the blog to be very detailed with lots of content to read from and also include Introduction and Conclusion paragraphs. 

Take reference from other successful blogs articles on other websites to include the most accurate data and improve the quality of the content.

Important Note: ${note}
Output format:
You need to follow this output format very strictly.
1) Output should be in .tsx format that I can directly copy paste inside the return statement of a .tsx file on my next.js website
2) Output should run without any errors I will paste the content inside the return statement so make sure not include anything else not even the return statment just the code inside of return statment
3) Do not include any other characters like quotes or double or anything else in starting or ending of the output.
4) Must include all meta tags needed for proper seo like "title" , "description" etc inside the <Head> tag
5) Wrap the title in <h1> tag and give it the className "blog-title".
6) Wrap subheading in <h2> tag and give it the className "sub-headings".
7) Wrap heading inside <h3> tag and give it the className "h3-heading".
8) Wrap the important keyword and targeted keywords inside <strong> tag
9) Use <table> tag to present tabular datain code
10) Make sure that all the tags and elements have closing tags <h1>,<p>,<strong>,<h2>,<meta>,<title> etc all of them and any other tag used should always have a closing tag as per the tsx guildlines` }
      ]
    });
    const blogContent = response.choices[0].message.content || '';
    // const blogContent = 'some content';
    const blogDirPath = path.join(process.cwd(), 'app', 'blogs', category,year, slug);
    const blogFilePath = path.join(blogDirPath, 'page.tsx');    
    
    if (!fs.existsSync(blogDirPath)) {
      fs.mkdirSync(blogDirPath, { recursive: true });
    }
    
    const blogPageContent = `
      import React from 'react';
      import Head from 'next/head'
      const ${slug.replace(/-/g, '_')}: React.FC = () => {
        return (
          <div className='blog-wrapper'>
          <div className='blog-body'>
            ${blogContent}
          </div>
          <div className='blog-sidebar'>
            <p>this is side bar</p>
          </div>
          </div>
        );
      };

      export default ${slug.replace(/-/g, '_')};
    `;
    // fs.writeFileSync(blogFilePath, blogPageContent, 'utf-8');
    const response2 = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are an skill full experienced professional and expertise in frontend development using next.js.` },
        { role: 'user', content: `Fix all the issues in the below tsx code for a .tsx file, make sure all tags have there closing tags and html entites are used properly and if you see any other problem with the code fix and only return the fixed out in output and nothing else. 
          Code:
          ${blogPageContent}` }
      ]
    });
    if(response.choices[0].message.content != null){
      const rawContent = response2.choices[0].message.content || "";
      const finalContent = rawContent.replace(/^[\s\S]*?(?=import)/, "").replace(/\n```$/, "");
      fs.writeFileSync(blogFilePath, finalContent, 'utf-8');
    }

    exec('git add . && git commit -m "Auto-generated blog: ' + slug + '" && git push', (error, stdout, stderr) => {
      if (error) {
        console.error(`Git Error: ${error.message}`);
        return new Response(JSON.stringify({ error: 'Git commit failed' }), { status: 500 });
      }
    });

updateDataFile(topic , slug , category , year);

    return new Response(JSON.stringify({ message: 'Blog created and pushed to Git!' }), { status: 200 });

  } catch (err) {
    console.error('Error generating blog:', err);
    return new Response(JSON.stringify({ error: 'Blog generation failed' }), { status: 500 });
  }
}
