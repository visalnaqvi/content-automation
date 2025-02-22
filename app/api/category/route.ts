import fs from "fs"
import path from "path"
import {exec} from "child_process"
import { Category } from "@/types/category"

function readCategories(categoryFilePath: string): Category[] {
  try {
    const fileContent = fs.readFileSync(categoryFilePath, "utf-8")
    return JSON.parse(fileContent)
  } catch (error) {
    console.error("Error reading categories file:", error)
    throw new Error("Failed to read categories file")
  }
}

function addTogit(message: string) {
  return new Promise((resolve, reject) => {
    exec(
      'git add . && git commit -m " ' + message + '" && git push',
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Git Error: ${error.message}`)
          reject(error)
        }
        resolve(stdout)
      }
    )
  })
}

export async function GET(req: Request) {
  try {
    const {searchParams} = new URL(req.url)
    const filterFor = searchParams.get("filterFor")
    const filterValue = searchParams.get("filterValue")

    const categoryFilePath = path.join(
      process.cwd(),
      "data",
      "category",
      "data.json"
    )

    let filteredData = readCategories(categoryFilePath)

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
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch categories",
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
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
      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation Error",
          message: "Missing required fields",
          details: {
            name: !name ? "Name is required" : null,
            image: !image ? "Image is required" : null,
            description: !description ? "Description is required" : null,
            key: !key ? "Key is required" : null
          }
        }), 
        {
          status: 400,
          headers: {"Content-Type": "application/json"}
        }
      )
    }

    const categoryFilePath = path.join(
      process.cwd(),
      "data",
      "category",
      "data.json"
    )

    let existingData = readCategories(categoryFilePath)

    // Check if category with same key already exists
    if (existingData.some(category => category.key === key)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Duplicate Entry",
          message: "Category with this key already exists"
        }),
        {
          status: 400,
          headers: {"Content-Type": "application/json"}
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

    existingData.unshift(newCategory)

    try {
      fs.writeFileSync(categoryFilePath, JSON.stringify(existingData, null, 2), "utf-8")
      await addTogit("Added new category " + key)
    } catch (writeError) {
      throw new Error(`Failed to save category: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Category added successfully",
        data: newCategory
      }),
      {
        status: 200,
        headers: {"Content-Type": "application/json"}
      }
    )
  } catch (error) {
    console.error("Error adding category:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal Server Error",
        message: "Failed to add category",
        details: error instanceof Error ? error.message : "Unknown error"
      }), 
      {
        status: 500,
        headers: {"Content-Type": "application/json"}
      }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const {key} = body

    if (!key) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation Error",
          message: "Category key is required"
        }), 
        {
          status: 400,
          headers: {"Content-Type": "application/json"}
        }
      )
    }

    const categoryFilePath = path.join(
      process.cwd(),
      "data",
      "category",
      "data.json"
    )

    let existingData = readCategories(categoryFilePath)

    const categoryIndex = existingData.findIndex(
      category => category.key === key
    )

    if (categoryIndex === -1) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Not Found",
          message: "Category not found"
        }), 
        {
          status: 404,
          headers: {"Content-Type": "application/json"}
        }
      )
    }

    // Remove the category
    const deletedCategory = existingData.splice(categoryIndex, 1)[0]

    try {
      fs.writeFileSync(categoryFilePath, JSON.stringify(existingData, null, 2), "utf-8")
      await addTogit("Deleted category " + key)
    } catch (writeError) {
      throw new Error(`Failed to delete category: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Category deleted successfully",
        data: deletedCategory
      }),
      {
        status: 200,
        headers: {"Content-Type": "application/json"}
      }
    )
  } catch (error) {
    console.error("Error deleting category:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal Server Error",
        message: "Failed to delete category",
        details: error instanceof Error ? error.message : "Unknown error"
      }), 
      {
        status: 500,
        headers: {"Content-Type": "application/json"}
      }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const {key, name, image, description} = body

    if (!key) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation Error",
          message: "Category key is required"
        }), 
        {
          status: 400,
          headers: {"Content-Type": "application/json"}
        }
      )
    }

    const categoryFilePath = path.join(
      process.cwd(),
      "data",
      "category",
      "data.json"
    )

    let existingData = readCategories(categoryFilePath)

    const categoryIndex = existingData.findIndex(
      category => category.key === key
    )

    if (categoryIndex === -1) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Not Found",
          message: "Category not found"
        }), 
        {
          status: 404,
          headers: {"Content-Type": "application/json"}
        }
      )
    }

    // Update the category
    const updatedCategory = {
      ...existingData[categoryIndex],
      name: name || existingData[categoryIndex].name,
      image: image || existingData[categoryIndex].image,
      description: description || existingData[categoryIndex].description,
    }
    
    existingData[categoryIndex] = updatedCategory

    try {
      fs.writeFileSync(categoryFilePath, JSON.stringify(existingData, null, 2), "utf-8")
      await addTogit("Updated category " + key)
    } catch (writeError) {
      throw new Error(`Failed to update category: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Category updated successfully",
        data: updatedCategory
      }),
      {
        status: 200,
        headers: {"Content-Type": "application/json"}
      }
    )
  } catch (error) {
    console.error("Error updating category:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal Server Error",
        message: "Failed to update category",
        details: error instanceof Error ? error.message : "Unknown error"
      }), 
      {
        status: 500,
        headers: {"Content-Type": "application/json"}
      }
    )
  }
}
