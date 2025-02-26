import category from "@/data/category/data.json"
import Link from "next/link";
import { Category } from "@/types/category";
import { Blog } from "@/types/blog";
import { Metadata } from "next";
import blogs from "@/data/blogs/2025/data.json"

export const metadata: Metadata = {
  title: "CUET UG Blogs | " + process.env.NEXT_PUBLIC_WEBSITE_NAME,
  description: process.env.NEXT_PUBLIC_CUET_UG_DESCRIPTION,
  keywords: process.env.NEXT_PUBLIC_CUET_UG_KEYWORDS,
};

export default function Home() {
  const currentCategory = category.find((item: { key: string }) => item.key === "cuet-ug") as Category | undefined
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
