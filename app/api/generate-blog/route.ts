"use server"
import {generateBlogTSXCode} from "../../../scripts/generateBlog"
import {BlogRequestData} from "@/types/blogRequestData"
import existingCategories from "@/data/category/data.json"

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function validateBlogRequest(body: BlogRequestData): Response | null {
  if (!body.topic) {
    return new Response(
      JSON.stringify({success: false, error: "Missing required field topic"}),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  } else if (body.topic.length > 50) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Topic must be less than 50 characters",
      }),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  }

  if (!body.slug) {
    return new Response(
      JSON.stringify({success: false, error: "Missing required field slug"}),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  } else if (body.slug.length > 50) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Slug must be less than 50 characters",
      }),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  } else if (!/^[a-zA-Z0-9-]+$/.test(body.slug)) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Slug can only contain letters, numbers and hyphens with no spaces",
      }),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  }

  if (!body.category) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing required field category",
      }),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  } else if (
    !existingCategories
      .map((cat: {key: string}) => cat.key)
      .includes(body.category)
  ) {
    return new Response(
      JSON.stringify({success: false, error: "Invalid category"}),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  }

  if (!body.year) {
    return new Response(
      JSON.stringify({success: false, error: "Missing required field year"}),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  } else if (body.year.length > 4 || body.year.length < 4) {
    return new Response(
      JSON.stringify({success: false, error: "Year must be 4 digits"}),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  }

  if (!body.keyword) {
    return new Response(
      JSON.stringify({success: false, error: "Missing required field keyword"}),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  }

  if (!body.wordLength) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing required field wordLength",
      }),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  } else if (typeof body.wordLength !== "number") {
    return new Response(
      JSON.stringify({success: false, error: "Word length must be a number"}),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  }

  if (!body.audience) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing required field audience",
      }),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  }

  if (!body.numberOfSubheading) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing required field numberOfSubheading",
      }),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  } else if (typeof body.numberOfSubheading !== "number") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Number of subheading must be a number",
      }),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  }

  if (!body.contentPara) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing required field contentPara",
      }),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  } else if (typeof body.contentPara !== "number") {
    return new Response(
      JSON.stringify({success: false, error: "Content para must be a number"}),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  }

  if (!body.contentWords) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing required field contentWords",
      }),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  } else if (!months.includes(body.month)) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Invalid month valid values are January, February, March, April, May, June, July, August, September, October, November, December",
      }),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  }

  if (!body.description) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing required field description",
      }),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  }

  if (!body.image) {
    return new Response(
      JSON.stringify({success: false, error: "Missing required field image"}),
      {status: 400, headers: {"Content-Type": "application/json"}}
    )
  }

  return null
}

export async function POST(req: Request) {
  try {
    const body: BlogRequestData = await req.json()

    const validationError = validateBlogRequest(body)
    if (validationError) {
      return validationError
    }

    console.log("✅ Validation passed. Generating blog TSX code...")

    try {
      generateBlogTSXCode(body).catch(error => {
        console.error("❌ Background Blog Generation Error:", error)
      })

      return new Response(
        JSON.stringify({
          success: true,
          message: "Blog generation Triggered Check logs for more info!",
        }),
        {status: 200, headers: {"Content-Type": "application/json"}}
      )
    } catch (error) {
      console.error("❌ Blog Generation Error:", error)
      return new Response(
        JSON.stringify({success: false, error: "Blog generation failed"}),
        {status: 500, headers: {"Content-Type": "application/json"}}
      )
    }
  } catch (error) {
    console.error("❌ API Error:", error)
    return new Response(
      JSON.stringify({success: false, error: "Server error"}),
      {status: 500, headers: {"Content-Type": "application/json"}}
    )
  }
}
