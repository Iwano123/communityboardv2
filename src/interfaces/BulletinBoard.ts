export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  created: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  category_id: number;
  category_name: string;
  category_color?: string;
  author_id: number;
  author_name: string;
  author_email: string;
  contact_info?: string;
  price?: number;
  location?: string;
  image_url?: string;
  is_featured: boolean;
  views: number;
  comments_count: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: number;
  author_name: string;
  content: string;
  created_at: string;
}