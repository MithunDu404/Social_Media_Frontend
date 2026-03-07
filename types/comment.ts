import { User } from "./auth";

export interface Comment {
    id: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
    post_id: number;
    user_id: number;
    user: Pick<User, "id" | "user_name" | "picture_url">;
    _count?: {
        likes: number;
        replies: number;
    };
}

export interface Reply {
    id: number;
    reply: string;
    createdAt: string;
    updatedAt: string;
    comment_id: number;
    user_id: number;
    user: Pick<User, "id" | "user_name" | "picture_url">;
    _count?: {
        likes: number;
    };
}
