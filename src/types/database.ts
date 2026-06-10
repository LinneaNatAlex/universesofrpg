export type PostType =
  | "character_sheet"
  | "code_template"
  | "story_segment"
  | "digital_asset"
  | "collab_thread"
  | "text_writing";

export type PricingType = "free" | "one_time" | "subscription";
export type ModerationStatus = "draft" | "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  persona_mode: boolean;
  is_verified_creator: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  type: PostType;
  title: string;
  description: string | null;
  /** Back-of-book plot synopsis — shown to guests */
  plot_synopsis: string | null;
  content: string | null;
  html_code: string | null;
  css_code: string | null;
  js_code: string | null;
  bbcode: string | null;
  preview_image_url: string | null;
  book_cover_url: string | null;
  invite_token: string | null;
  pricing: PricingType;
  price_cents: number;
  is_code_locked: boolean;
  moderation_status: ModerationStatus;
  is_ai_generated: boolean;
  tags: string[];
  style_tags: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  author?: Profile;
}

export interface FeedPost extends Post {
  author: Profile;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_username: string;
  author_display_name: string;
  body: string;
  created_at: string;
}

export interface RpgForumMeta {
  era: string;
  season: string;
  location: string;
  when: string;
}

export interface ForumChapter {
  number: number;
  title: string;
  meta: RpgForumMeta;
  posts: ForumPost[];
}

export interface ForumPost {
  id: string;
  author_username: string;
  body: string;
  created_at: string;
}

export interface RpgForum {
  id: string;
  title: string;
  book_cover_url: string | null;
  members: string[];
  chapters: ForumChapter[];
  created_at: string;
}
