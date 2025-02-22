import { Blog } from "./blog"

export type Category = {
    name:string
    image:string
    description:string
    key:string
    blogs:Blog[]
}   