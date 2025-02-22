import category from "@/data/category/data.json"
import Link from "next/link";
import { Category } from "@/types/category";
import { Blog } from "@/types/blog";
import { Metadata } from "next";
import blogs from "@/data/blogs/2025/upsc/data.json"

export const metadata: Metadata = {
  title: "UPSC Blogs | " + process.env.NEXT_PUBLIC_WEBSITE_NAME,
  description: process.env.NEXT_PUBLIC_UPSC_DESCRIPTION,
  keywords: process.env.NEXT_PUBLIC_UPSC_KEYWORDS,
};

export default function Home() {
    const currentCategory:Category | undefined = category.find((item: Category) => item.key === "upsc")
  return (
    <div>
      <main>
        <div className="section">
              <h2 className="section-title">{currentCategory?.name}</h2>
              <p>{currentCategory?.description}</p>
              <br />
              <div className="category-cards-holder">
                {
                  blogs.map((b: Blog, i: number) => (
                    <div key={i} className="category-card">
                      <div><h3>{b.title}</h3>
                      </div>
                      <Link href={b.url}><button className="read-more-btn">Read More</button></Link>
                    </div>
                  ))
                }
              </div>
            </div>
      </main>
    </div>
  );
}
