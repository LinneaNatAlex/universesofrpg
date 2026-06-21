export type PostType =
  | "character_sheet"
  | "code_template"
  | "story_segment"
  | "digital_asset"
  | "collab_thread"
  | "text_writing";

export type PricingType = "free" | "one_time" | "subscription";
export type ModerationStatus = "draft" | "pending" | "approved" | "rejected";

export type EditorLevel = "junior" | "standard" | "senior" | "admin_verified";

export type EditorApplicationStatus = "pending" | "approved" | "rejected";

export type AiCheckStatus = "pending" | "passed" | "flagged";

export interface EditorProfile {
  username: string;
  display_name: string;
  level: EditorLevel;
  /** Hourly or per-review rate in cents (editor sets within platform range) */
  rate_cents_min: number;
  rate_cents_max: number;
  trust_score: number;
  reviews_completed: number;
  granted_at: string;
  granted_by: string;
}

export interface EditorApplication {
  id: string;
  applicant_username: string;
  applicant_display_name: string;
  applicant_email: string;
  motivation: string;
  /** Portfolio URL, certificate link, or pasted sample text */
  sample_content: string;
  sample_type: "writing" | "code" | "certificate" | "portfolio";
  owns_work_confirmed: boolean;
  status: EditorApplicationStatus;
  ai_check_status: AiCheckStatus;
  ai_check_note: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export interface EditorReviewRecord {
  id: string;
  post_id: string;
  post_title: string;
  editor_username: string;
  editor_display_name: string;
  editor_level: EditorLevel;
  decision: "approved" | "rejected";
  feedback: string | null;
  quality_score: number | null;
  created_at: string;
}

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

export type VerificationApplicationStatus = "pending" | "approved" | "rejected";

export interface VerificationApplication {
  id: string;
  applicant_username: string;
  applicant_display_name: string;
  applicant_email: string;
  motivation: string;
  total_likes: number;
  total_comments: number;
  posts_count: number;
  verification_fee_cents: number;
  status: VerificationApplicationStatus;
  reviewed_by: string | null;
  created_at: string;
}

export interface FriendLink {
  username: string;
  display_name: string;
  added_at: string;
}

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export interface FriendRequest {
  id: string;
  from_username: string;
  from_display_name: string;
  to_username: string;
  to_display_name: string;
  status: FriendRequestStatus;
  created_at: string;
  responded_at: string | null;
}

export type ConversationType = "dm" | "group" | "editor_review";

export type ConversationParticipantRole = "owner" | "member" | "editor" | "creator";

export interface ConversationParticipant {
  username: string;
  display_name: string;
  role: ConversationParticipantRole;
  joined_at: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string | null;
  post_id: string | null;
  post_title: string | null;
  participants: ConversationParticipant[];
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_preview: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  author_username: string;
  author_display_name: string;
  body: string;
  created_at: string;
  read_by: string[];
}

export type ReportTargetType = "post" | "comment" | "user" | "message" | "conversation";
export type ReportStatus = "open" | "resolved" | "dismissed";

export interface Report {
  id: string;
  target_type: ReportTargetType;
  post_id: string | null;
  post_title: string | null;
  comment_id: string | null;
  target_username: string | null;
  target_display_name: string | null;
  conversation_id: string | null;
  message_id: string | null;
  reporter_username: string;
  reporter_display_name: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
}

export type PersonaPageMode = "code" | "text";

export type ContentRating = "everyone" | "peg12" | "peg16" | "peg18";

/** Custom RPG persona landing tab on a creator profile */
export interface PersonaProfilePage {
  username: string;
  mode: PersonaPageMode;
  html_code: string | null;
  css_code: string | null;
  js_code: string | null;
  text_content: string | null;
  music_url: string | null;
  updated_at: string;
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
  /** Public live-demo HTML/CSS/JS — kept on the post for storefront preview. */
  preview_html_code?: string | null;
  preview_css_code?: string | null;
  preview_js_code?: string | null;
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
  /** Writing studio category — book, letter, character creation, etc. */
  writing_category?: string | null;
  /** Illustration gallery — digital_asset posts. First image is the list cover. */
  illustration_images?: string[];
  /** Optional ambient track for code templates — not part of sold source. */
  theme_music_url?: string | null;
  /** Optional creator-written guide for buyers — not part of sold source code. */
  template_readme?: string | null;
  /** Creator-declared sexual content — PEGI 18, adults only. */
  contains_sexual_content?: boolean;
  content_rating?: ContentRating;
  like_count: number;
  comment_count: number;
  created_at: string;
  /** Bumped on every edit — used when merging local vs live Supabase state. */
  updated_at?: string;
  /** When false, post appears only on profile Character Creations — not home feed / Explore. */
  show_on_feed?: boolean;
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
  /** When set, this comment is a reply to another comment on the same post */
  parent_comment_id: string | null;
  created_at: string;
}

/** Public live chat message on the home page (realm lobby). */
export interface HomepageChatMessage {
  id: string;
  author_username: string;
  author_display_name: string;
  body: string;
  created_at: string;
  /** Set when the author was a platform admin at send time. */
  author_is_admin?: boolean;
}

export interface DiscussionThread {
  id: string;
  title: string;
  body: string;
  author_username: string;
  author_display_name: string;
  category: string;
  tags: string[];
  reply_count: number;
  views: number;
  created_at: string;
  last_activity_at: string;
  contains_sexual_content?: boolean;
  content_rating?: ContentRating;
}

export interface DiscussionReply {
  id: string;
  thread_id: string;
  author_username: string;
  author_display_name: string;
  body: string;
  created_at: string;
}

export interface TopicCharacter {
  id: string;
  name: string;
  /** Free-form age — e.g. "24", "ancient", "unknown". */
  age: string | null;
  owner_username: string;
  /** Optional link to a profile Character Creation post. */
  linked_post_id: string | null;
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
  updated_at?: string | null;
  /** In-character voice for this reply — set from the writer's topic character. */
  character_id?: string | null;
}

export interface RpgForum {
  id: string;
  title: string;
  /** Short teaser — universe hook for readers browsing topics */
  plot_synopsis: string | null;
  book_cover_url: string | null;
  creator_username: string;
  category: string;
  tags: string[];
  members: string[];
  chapters: ForumChapter[];
  /** Play-by-post personas registered by writers in this topic. */
  characters?: TopicCharacter[];
  /** Members-only — hidden from public topic list */
  is_private: boolean;
  /** Story marked complete — no new parts or replies */
  is_locked: boolean;
  locked_at: string | null;
  /** Paid Shop listing id when published after lock */
  shop_post_id: string | null;
  shop_price_cents: number | null;
  contains_sexual_content?: boolean;
  content_rating?: ContentRating;
  created_at: string;
}
