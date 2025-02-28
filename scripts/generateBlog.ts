import {Category} from "@/types/category"
import {Blog} from "@/types/blog"
import existingCategoryData from "@/data/category/data.json"
const categoryData: Category[] = existingCategoryData as Category[]
import {Octokit} from "@octokit/rest"
import OpenAI from "openai"
const octokit = new Octokit({auth: process.env.GITHUB_TOKEN})
import blogs from "@/data/blogs/2025/data.json"
const blogsData: Blog[] = blogs as Blog[]
import {BlogRequestData} from "@/types/blogRequestData"
import fs from "fs"
import path from "path"
import {exec} from "child_process"
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "test-api-key",
})

function logSuccess(message: string) {
  console.log(`✅ ${message}`)
}

function logInfo(message: string) {
  console.log(`ℹ️ ${message}`)
}

function logError(message: string, error?: unknown) {
  console.error(`❌ ${message}`)
  if (error) {
    console.error("Error details:", error)
  }
}

async function addTogit(
  existingBlogsData: string,
  newBlog: string,
  existingCategoryData: string,
  newBlogPath: string
) {
  logInfo("Starting GitHub update process...")
  try {
    // Get the main branch reference
    // logInfo("Fetching main branch reference...")
    // const ref = await octokit.git.getRef({
    //   owner: process.env.GITHUB_OWNER || "",
    //   repo: process.env.GITHUB_REPO || "",
    //   ref: process.env.GITHUB_REPO_REF || "",
    // })

    // logInfo("Creating new Git tree...")
    // const tree = await octokit.git.createTree({
    //   owner: process.env.GITHUB_OWNER || "",
    //   repo: process.env.GITHUB_REPO || "",
    //   base_tree: ref.data.object.sha,
    //   tree: [
    //     {
    //       path: process.env.CATEGORY_FILE_PATH || "",
    //       mode: "100644",
    //       type: "blob",
    //       content: existingCategoryData,
    //     },
    //     {
    //       path: process.env.BLOG_FILE_PATH || "",
    //       mode: "100644",
    //       type: "blob",
    //       content: existingBlogsData,
    //     },
    //     {
    //       path: newBlogPath,
    //       mode: "100644",
    //       type: "blob",
    //       content: newBlog,
    //     },
    //   ],
    // })

    // logInfo("Creating commit...")
    // const commit = await octokit.git.createCommit({
    //   owner: process.env.GITHUB_OWNER || "",
    //   repo: process.env.GITHUB_REPO || "",
    //   message: "Update blog and category files",
    //   tree: tree.data.sha,
    //   parents: [ref.data.object.sha],
    // })

    // logInfo("Updating reference...")
    // await octokit.git.updateRef({
    //   owner: process.env.GITHUB_OWNER || "",
    //   repo: process.env.GITHUB_REPO || "",
    //   ref: process.env.GITHUB_REPO_REF || "",
    //   sha: commit.data.sha,
    // })

    exec(`git add .`)
    exec(`git commit -m "Update blog and category files"`)
    exec(`git push`)

    logSuccess("Successfully updated GitHub repository")
  } catch (error: unknown) {
    logError("Failed to update GitHub", error)
    throw error
  }
}
async function updateCategoryFile(existingBlogsData: Blog[], newBlog: string) {
  logInfo("Updating category file...")
  const newBlogMeta = existingBlogsData[0]
  try {
    const categoryIndex = categoryData.findIndex(
      c => c.key === newBlogMeta.category
    )
    let currentCategory = categoryData[categoryIndex]
    if (currentCategory) {
      if (currentCategory.blogs.length >= 20) {
        currentCategory.blogs.pop()
      }
      currentCategory.blogs.unshift(newBlogMeta)

      categoryData[categoryIndex] = currentCategory as Category
      logSuccess("Category file updated successfully")
      fs.writeFileSync(
        process.env.CATEGORY_FILE_PATH || "/data/category/data.json",
        JSON.stringify(categoryData, null, 2)
      )
      await addTogit(
        JSON.stringify(existingBlogsData, null, 2),
        newBlog,
        JSON.stringify(categoryData, null, 2),
        "app/" + newBlogMeta.url + "/page.tsx"
      )
    } else {
      logError("Category does not exist")
      throw new Error("Category does not exist")
    }
  } catch (error) {
    logError("Failed to update category file", error)
    throw error
  }
}

async function updateDataFile(existingBlogsData: Blog[], newBlog: string) {
  try {
    await updateCategoryFile(existingBlogsData, newBlog)
  } catch (error) {
    logError("Error updating data.json", error)
    throw error
  }
}

async function generateBlogInnerCode(
  keyword: string,
  wordLength: number,
  topic: string,
  audience: string,
  numberOfSubheading: number,
  contentPara: number,
  contentWords: number,
  note: string
) {
  logInfo(`Generating blog content for topic: "${topic}"`)
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an skill full experienced professional and expertise in ${keyword}.`,
        },
        {
          role: "user",
          content: `Your goal is to Write a blog post with minimum ${wordLength} words on topic "${topic}" with the targeted keyword "${keyword}" for audience of "${audience}" and use very human tone to include such keywords and content in this blog post that it should help my education website to improve its ranking for the targeted keyword.

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
4) Wrap the title in <h1> tag and give it the className "blog-title".
5) Wrap subheading in <h2> tag and give it the className "sub-headings".
6) Wrap heading inside <h3> tag and give it the className "h3-heading".
7) Wrap the important keyword and targeted keywords inside <strong> tag
8) Use <table> tag to present tabular datain code
9) Make sure that all the tags and elements have closing tags <h1>,<p>,<strong>,<h2>,<meta>,<title> etc all of them and any other tag used should always have a closing tag as per the tsx guildlines`,
        },
      ],
    })

    if (!response.choices[0].message.content) {
      logError("No content generated from OpenAI")
      throw new Error("Failed to generate blog content")
    }

    logSuccess("Blog content generated successfully")
    return response.choices[0].message.content
  } catch (error) {
    logError("Failed to generate blog content", error)
    throw error
  }
}

function generateCompleteTSXCode(
  topic: string,
  description: string,
  slug: string,
  category: string,
  blogContent: string
) {
  return `
      import React from 'react';
      import { Metadata } from "next";
      import { Category } from "@/types/category";
      import allCategory from "@/data/category/data.json"
      import Link from 'next/link';
      import { Blog } from '@/types/blog';
      export const metadata: Metadata = {
        title: "${topic}",
        description: "${description}",
      };
      const ${slug.replace(/-/g, "_")}: React.FC = () => {
        const category = "${category}"
        const currentCategory:Category | undefined = allCategory.find((item: Category) => item.key === category)
        return (
          <div className='blog-wrapper'>
          <div className='blog-body'>
            ${blogContent}
          </div>
          <div className='blog-sidebar'>
        <h2>Related Blogs</h2>
      <div className="category-cards-holder">
                {
                  currentCategory && currentCategory.blogs.map((b: Blog, i: number) => (
                    <div key={i} className="category-card">
                      <div><h3>{b.title}</h3>
                      </div>
                      <Link href={b.url}><button className="read-more-btn">Read More</button></Link>
                    </div>
                  ))
                }
              </div>
      </div>
          </div>
        );
      };

      export default ${slug.replace(/-/g, "_")};
    `
}

async function generateBlogFinalCode(blogTSXCode: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an skill full experienced professional and expertise in frontend development using next.js.`,
      },
      {
        role: "user",
        content: `Fix all the issues in the below tsx code for a .tsx file, make sure all tags have there closing tags and html entites are used properly and if you see any other problem with the code fix and only return the fixed out in output and nothing else. 
          Code:
          ${blogTSXCode}`,
      },
    ],
  })

  if (!response.choices[0].message.content) {
    throw new Error("Failed to format blog content")
  }

  return response.choices[0].message.content
}
export async function generateBlogTSXCode(blogRequestData: BlogRequestData) {
  const {
    topic,
    slug,
    category,
    year,
    keyword,
    wordLength,
    audience,
    numberOfSubheading,
    contentPara,
    contentWords,
    month,
    note,
    description,
    image,
  } = blogRequestData as BlogRequestData

  logInfo(`Starting blog generation process for: "${topic}"`)

  try {
    logInfo("Generating blog inner content...")
    const blogContent = await generateBlogInnerCode(
      keyword,
      wordLength,
      topic,
      audience,
      numberOfSubheading,
      contentPara,
      contentWords,
      note
    )

    logInfo("Generating complete TSX code...")
    const generatedBlogCode = generateCompleteTSXCode(
      topic,
      description,
      slug,
      category,
      blogContent
    )

    logInfo("Formatting final blog content...")
    const rawContent = await generateBlogFinalCode(generatedBlogCode)
    const finalContent = rawContent
      .replace(/^[\s\S]*?(?=import)/, "")
      .replace(/\n```$/, "")

    const newBlogMeta: Blog = {
      date: new Date().toISOString(),
      year,
      category,
      id: blogsData.length + 1,
      url: `blogs/${category}/${year}/${slug}`,
      title: topic,
      description,
      img: image,
      slug: slug,
      month: month,
    }

    blogsData.unshift(newBlogMeta)
    fs.mkdirSync(
      path.dirname(`app/blogs/${category}/${year}/${slug}/page.tsx`),
      {recursive: true}
    )
    fs.writeFileSync(
      `app/blogs/${category}/${year}/${slug}/page.tsx`,
      finalContent
    )
    fs.writeFileSync(
      process.env.BLOGS_FILE_PATH || "/data/blogs/2025/data.json",
      JSON.stringify(blogsData, null, 2)
    )
    logInfo("Updating data files...")
    await updateDataFile(blogsData as Blog[], finalContent)

    logSuccess("Blog generation completed successfully")
  } catch (error) {
    logError("Failed to generate blog", error)
    throw error
  }
}
