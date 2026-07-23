export type Category =
  | "ALL"
  | "BOOKS"
  | "ELECTRONICS"
  | "FURNITURE"
  | "CLOTHING"
  | "OTHER";

export interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  images: string[];
  createdAt: string;
  seller: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}
