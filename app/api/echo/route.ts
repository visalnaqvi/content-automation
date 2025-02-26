export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Hello! The API endpoint is working correctly",
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}
