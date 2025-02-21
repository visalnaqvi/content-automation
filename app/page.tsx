import category from "../data/category/data.json"
import Link from "next/link";
import { Category } from "@/types/category";
import { Blog } from "@/types/blog";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_WEBSITE_NAME + " | Home",
  description: process.env.NEXT_PUBLIC_WEBSITE_KEYWORDS,
};

export default function Home() {

  return (
    <div>
      <main>
        <div className="hero">
          <div className="hero-content">
            <h1>{process.env.NEXT_PUBLIC_WEBSITE_TITLE}</h1>
            <p>{process.env.NEXT_PUBLIC_WEBSITE_DESCRIPTION}</p>
            <button className="heroBtn">Enroll Now</button>
          </div>
        </div>
        {
          category.map((c: Category, i: number) => (
            c.blogs.length > 0 && <div key={i} className="section">
              <h2 className="section-title">{c.name}</h2>
              <p>{c.description}</p>
              <div className="category-cards-holder">
                {
                  c.blogs.map((b: Blog, i: number) => (
                    <div key={i} className="category-card">
                      <div><h3>{b.title}</h3>
                      </div>
                      <Link href={b.url}><button className="read-more-btn">Read More</button></Link>
                    </div>
                  ))
                }
              </div>
            </div>
          ))
        }
      </main>
    </div>
  );
}
