import fs from "fs"
import path from "path"
import {exec} from "child_process"
import OpenAI from "openai"
import {BlogRequestData} from "@/types/blogRequestData"
import {Blog} from "@/types/blog"
import {Category} from "@/types/category"
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "test-api-key",
})

function validateBlogRequest(data: any): data is BlogRequestData {
  const requiredFields: (keyof BlogRequestData)[] = [
    "topic",
    "slug",
    "category",
    "year",
    "keyword",
    "wordLength",
    "audience",
    "numberOfSubheading",
    "contentPara",
    "contentWords",
    "month",
    "note",
    "description",
  ]

  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  // Validate number fields
  if (typeof data.wordLength !== "number" || data.wordLength <= 0) {
    throw new Error("wordLength must be a positive number")
  }
  if (
    typeof data.numberOfSubheading !== "number" ||
    data.numberOfSubheading <= 0
  ) {
    throw new Error("numberOfSubheading must be a positive number")
  }
  if (typeof data.contentPara !== "number" || data.contentPara <= 0) {
    throw new Error("contentPara must be a positive number")
  }
  if (typeof data.contentWords !== "number" || data.contentWords <= 0) {
    throw new Error("contentWords must be a positive number")
  }

  return true
}

function updateCategoryFile(blog: Blog, category: string) {
  const categoryFilePath = path.join(
    process.cwd(),
    "data",
    "category",
    "data.json"
  )
  const categoryDirPath = path.dirname(categoryFilePath)

  try {
    let existingData: Category[] = []

    if (!fs.existsSync(categoryDirPath)) {
      fs.mkdirSync(categoryDirPath, {recursive: true})
    }

    if (fs.existsSync(categoryFilePath)) {
      const fileContent = fs.readFileSync(categoryFilePath, "utf-8")
      existingData = JSON.parse(fileContent)
    }

    let categoryData = existingData.find(c => c.key === category)

    if (categoryData) {
      if (categoryData.blogs.length >= 10) {
        categoryData.blogs.pop()
      }
      categoryData.blogs.unshift(blog)

      fs.writeFileSync(
        categoryFilePath,
        JSON.stringify(existingData, null, 2),
        "utf-8"
      )

      console.log("Updated category data.json file successfully")
    } else {
      throw new Error("Category does not exist")
    }
  } catch (error) {
    console.error("Error updating category file:", error)
    throw error
  }
}

function updateDataFile(
  topic: string,
  slug: string,
  category: string,
  year: string,
  month: string,
  description: string
) {
  const dataFilePath = path.join(
    process.cwd(),
    "data",
    "blogs",
    year,
    month,
    category,
    "data.json"
  )
  const dataDirPath = path.dirname(dataFilePath)

  try {
    let existingData: any[] = []

    if (!fs.existsSync(dataDirPath)) {
      fs.mkdirSync(dataDirPath, {recursive: true})
    }

    if (fs.existsSync(dataFilePath)) {
      const fileContent = fs.readFileSync(dataFilePath, "utf-8")
      existingData = JSON.parse(fileContent)
    }

    const newEntry = {
      date: new Date().toISOString().split("T")[0],
      year,
      category,
      id: existingData.length,
      url: `/blogs/${category}/${year}/${slug}`,
      title: topic,
      description: description,
      img: `/images/blogs/${slug}.jpg`,
    }

    existingData.unshift(newEntry)

    fs.writeFileSync(
      dataFilePath,
      JSON.stringify(existingData, null, 2),
      "utf-8"
    )

    console.log("Updated data.json file successfully")
    updateCategoryFile(newEntry, category)
  } catch (error) {
    console.error("Error updating data.json:", error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate request data
    if (!validateBlogRequest(body)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request data",
          message:
            "The request data is missing required fields or contains invalid values",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    }

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
    } = body as BlogRequestData

    const categoryFilePath = path.join(
      process.cwd(),
      "data",
      "category",
      "data.json"
    )
    let categories: Category[]
    try {
      const categoryContent = fs.readFileSync(categoryFilePath, "utf-8")
      categories = JSON.parse(categoryContent)
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid category data",
          message: "Failed to read or parse category data",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    }

    const categoryExists = categories.some(c => c.key === category)

    if (!categoryExists) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid category",
          message: "The specified category does not exist",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    }

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
      throw new Error("Failed to generate blog content")
    }

    const blogContent = response.choices[0].message.content
    const blogDirPath = path.join(
      process.cwd(),
      "app",
      "blogs",
      category,
      year,
      slug
    )
    const blogFilePath = path.join(blogDirPath, "page.tsx")

    if (!fs.existsSync(blogDirPath)) {
      fs.mkdirSync(blogDirPath, {recursive: true})
    }

    const blogPageContent = `
      import React from 'react';
      import type { Metadata } from "next";
      export const metadata: Metadata = {
        title: ${topic},
        description: ${description},
      };
      const ${slug.replace(/-/g, "_")}: React.FC = () => {
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

      export default ${slug.replace(/-/g, "_")};
    `
    const response2 = await openai.chat.completions.create({
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
          ${blogPageContent}`,
        },
      ],
    })

    if (!response2.choices[0].message.content) {
      throw new Error("Failed to format blog content")
    }

    const rawContent = response2.choices[0].message.content
    const finalContent = rawContent
      .replace(/^[\s\S]*?(?=import)/, "")
      .replace(/\n```$/, "")
    fs.writeFileSync(blogFilePath, finalContent, "utf-8")

    updateDataFile(topic, slug, category, year, month, description)

    exec(
      'git add . && git commit -m "Auto-generated blog: ' +
        slug +
        '" && git push',
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Git Error: ${error.message}`)
          throw new Error("Failed to commit changes to Git")
        }
      }
    )

    return new Response(
      JSON.stringify({
        success: true,
        message: "Blog created and pushed to Git successfully!",
        data: {
          slug,
          topic,
          category,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  } catch (err) {
    console.error("Error generating blog:", err)
    return new Response(
      JSON.stringify({
        success: false,
        error: "Blog generation failed",
        message:
          err instanceof Error ? err.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
}
