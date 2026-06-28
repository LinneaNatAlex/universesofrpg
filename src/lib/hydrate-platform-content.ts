import {
  fetchCommentsPlatformState,
  fetchDiscussionsPlatformState,
  fetchForumsPlatformState,
  fetchHomepageChatPlatformState,
  fetchPostsPlatformState,
  mergeCommentsState,
  mergeDiscussionsState,
  mergeForumsState,
  mergeHomepageChatState,
  mergePostsState,
} from "@/lib/content-sync";
import {
  applyCommentsPersistState,
  buildCommentsPersistState,
} from "@/lib/mock-comments";
import {
  applyHomepageChatPersistState,
  buildHomepageChatPersistState,
} from "@/lib/homepage-chat-store";
import {
  applyDiscussionsPersistState,
  buildDiscussionsPersistState,
} from "@/lib/discussions-store";
import {
  applyForumsPersistState,
  buildForumsPersistState,
} from "@/lib/forums-store";
import {
  applyPostsPersistState,
  buildPostsPersistState,
} from "@/lib/posts-store";

/** Pull live platform content from the server and merge into local stores. */
export async function hydratePlatformContent(): Promise<boolean> {
  const [remotePosts, remoteForums] = await Promise.all([
    fetchPostsPlatformState(),
    fetchForumsPlatformState(),
  ]);

  let updated = false;

  if (remotePosts) {
    const local = buildPostsPersistState();
    applyPostsPersistState(mergePostsState(local, remotePosts));
    updated = true;
  }

  if (remoteForums) {
    const local = buildForumsPersistState();
    applyForumsPersistState(mergeForumsState(local, remoteForums));
    updated = true;
  }

  const [remoteComments, remoteDiscussions, remoteHomepageChat] = await Promise.all([
    fetchCommentsPlatformState(),
    fetchDiscussionsPlatformState(),
    fetchHomepageChatPlatformState(),
  ]);

  if (remoteComments) {
    const local = buildCommentsPersistState();
    applyCommentsPersistState(mergeCommentsState(local, remoteComments));
    updated = true;
  }

  if (remoteDiscussions) {
    const local = buildDiscussionsPersistState();
    applyDiscussionsPersistState(mergeDiscussionsState(local, remoteDiscussions));
    updated = true;
  }

  if (remoteHomepageChat) {
    const local = buildHomepageChatPersistState();
    applyHomepageChatPersistState(mergeHomepageChatState(local, remoteHomepageChat));
    updated = true;
  }

  return updated;
}
