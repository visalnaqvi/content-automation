import {data as categories} from "@/data/category/data"
import fs from "fs"
import path from "path"
import {exec} from "child_process"
import { Category } from "@/types/category"
function addTogit(message: string) {
  exec(
    'git add . && git commit -m " ' + message + '" && git push',
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Git Error: ${error.message}`)
        return new Response(JSON.stringify({error: "Git commit failed"}), {
          status: 500,
        })
      }
    }
  )
}

export async function GET(req: Request) {
  try {
    const {searchParams} = new URL(req.url)
    const filterFor = searchParams.get("filterFor")
    const filterValue = searchParams.get("filterValue")

    let filteredData = [...categories]

    // Apply filtering if filterFor and filterValue are provided
    if (filterFor && filterValue) {
      filteredData = filteredData.filter(
        category =>
          category[filterFor as keyof Category]?.toString().toLowerCase() ===
          filterValue.toLowerCase()
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: filteredData,
        message: "Categories fetched successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    console.error("Error reading categories:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch categories",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {name, image, description, key} = body

    if (!name || !image || !description || !key) {
      return new Response(JSON.stringify({error: "Missing required fields"}), {
        status: 400,
      })
    }

    const categoryFilePath = path.join(
      process.cwd(),
      "data",
      "category",
      "data.ts"
    )

    let existingData: Category[] = [...categories]

    // Check if category with same key already exists
    if (existingData.some(category => category.key === key)) {
      return new Response(
        JSON.stringify({error: "Category with this key already exists"}),
        {
          status: 400,
        }
      )
    }
    const newCategory: Category = {
      name,
      image,
      description,
      key,
      blogs: [],
    }

    existingData.push(newCategory)

    const updatedContent = `export const data = ${JSON.stringify(
      existingData,
      null,
      2
    )};`
    fs.writeFileSync(categoryFilePath, updatedContent, "utf-8")
    addTogit("Added new category " + key)
    return new Response(
      JSON.stringify({message: "Category added successfully"}),
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error adding category:", error)
    return new Response(JSON.stringify({error: "Failed to add category"}), {
      status: 500,
    })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const {key} = body

    if (!key) {
      return new Response(JSON.stringify({error: "Category key is required"}), {
        status: 400,
      })
    }

    const categoryFilePath = path.join(
      process.cwd(),
      "data",
      "category",
      "data.ts"
    )

    let existingData: Category[] = [...categories]

    const categoryIndex = existingData.findIndex(
      category => category.key === key
    )
    addTogit("Deleted category " + key)
    if (categoryIndex === -1) {
      return new Response(JSON.stringify({error: "Category not found"}), {
        status: 404,
      })
    }

    // Remove the category
    existingData.splice(categoryIndex, 1)

    const updatedContent = `export const data = ${JSON.stringify(
      existingData,
      null,
      2
    )};`
    fs.writeFileSync(categoryFilePath, updatedContent, "utf-8")

    return new Response(
      JSON.stringify({message: "Category deleted successfully"}),
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error deleting category:", error)
    return new Response(JSON.stringify({error: "Failed to delete category"}), {
      status: 500,
    })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const {key, name, image, description} = body

    if (!key) {
      return new Response(JSON.stringify({error: "Category key is required"}), {
        status: 400,
      })
    }

    const categoryFilePath = path.join(
      process.cwd(),
      "data",
      "category",
      "data.ts"
    )

    let existingData: Category[] = [...categories]

    const categoryIndex = existingData.findIndex(
      category => category.key === key
    )

    if (categoryIndex === -1) {
      return new Response(JSON.stringify({error: "Category not found"}), {
        status: 404,
      })
    }

    // Update the category
    existingData[categoryIndex] = {
      ...existingData[categoryIndex],
      name: name || existingData[categoryIndex].name,
      image: image || existingData[categoryIndex].image,
      description: description || existingData[categoryIndex].description,
    }

    const updatedContent = `export const data = ${JSON.stringify(
      existingData,
      null,
      2
    )};`
    fs.writeFileSync(categoryFilePath, updatedContent, "utf-8")
    addTogit("Updated category " + key)
    return new Response(
      JSON.stringify({message: "Category updated successfully"}),
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error updating category:", error)
    return new Response(JSON.stringify({error: "Failed to update category"}), {
      status: 500,
    })
  }
}
