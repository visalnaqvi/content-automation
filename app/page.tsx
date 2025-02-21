import category from "../data/category/data.json"
import Link from "next/link";
import Head from "next/head";
import { Category } from "@/types/category";
import { Blog } from "@/types/blog";
export default function Home() {
  return (
    <div>
      <Head>
        <title>{process.env.NEXT_PUBLIC_WEBSITE_NAME} | Home</title>
        <meta name="description" content={process.env.NEXT_PUBLIC_WEBSITE_TITLE} />
        <meta name="keywords" content={process.env.NEXT_PUBLIC_WEBSITE_KEYWORDS} />
      </Head>
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
                      <h3>{b.title}</h3>
                      <p>{b.description}</p>
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
