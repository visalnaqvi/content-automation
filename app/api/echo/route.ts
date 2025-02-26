import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "test-api-key",
})

async function checkChat() {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a skilled and experienced professional with expertise in frontend development using Next.js.`,
      },
      {
        role: "user",
        content: `Say Hello`,
      },
    ],
  })

  if (!response.choices[0].message.content) {
    throw new Error("Failed to format blog content")
  }

  console.log("Response from OpenAI:", response.choices[0].message.content)
  return response.choices[0].message.content
}

export async function GET() {
  try {
    const msg = await checkChat() // ✅ Await the function

    return new Response(
      JSON.stringify({
        message: msg, // ✅ Correctly returning the response
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    console.error("Error in API:", error)
    return new Response(
      JSON.stringify({error: "Failed to generate response"}),
      {status: 500, headers: {"Content-Type": "application/json"}}
    )
  }
}
