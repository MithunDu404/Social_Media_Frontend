export interface Post {
  id: number;
  title: string;
  blog: string;
  createdAt: string;
  updatedAt: string;
  user_id: number;

  medias: {
    id: number;
    url: string;
    content_type: string;
    size: number;
    createdAt: string;
    post_id: number;
  }[];

  user: {
    id: number;
    user_name: string;
    picture_url: string;
  };

  commentCount: number;
  likeCount: number;

  isLiked: Boolean;
}
