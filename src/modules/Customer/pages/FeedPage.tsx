import React, { useEffect, useState, useCallback } from 'react';
import type { Post, Comment } from '../../../types';
import { HeartIcon } from '../../../components/icons/HeartIcon';
import { MessageCircleIcon } from '../../../components/icons/MessageCircleIcon';
import { MapPinIcon } from '../../../components/icons/MapPinIcon';

import { supabase } from '../../../services/supabaseClient';


/* --------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------- */
const formatTimeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

const getCurrentUserId = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
};

/* --------------------------------------------------------------------
   PostCard – unchanged UI
   -------------------------------------------------------------------- */
const PostCard: React.FC<{
    post: Post;
    onLike: (postId: string) => void;
    onComment: (postId: string, text: string) => void;
}> = ({ post, onLike, onComment }) => {
    const [commentText, setCommentText] = useState('');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentText.trim()) {
            onComment(post.id, commentText.trim());
            setCommentText('');
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center space-x-3">
                <img src={post.author.avatarUrl} alt={post.author.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                    <p className="font-semibold text-gray-800">{post.author.name}</p>
                    <div className="flex items-center text-xs text-gray-500">
                        <span>{post.timestamp}</span>
                        {post.location && (
                            <>
                                <span className="mx-1">·</span>
                                <span className="flex items-center">
                                    <MapPinIcon size={14} className="inline mr-1" />
                                    {post.location}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="px-4 pb-3">
                <p className="text-gray-700">{post.content}</p>
            </div>

            {post.imageUrl && <img src={post.imageUrl} alt="" className="w-full object-cover" />}

            {/* Actions */}
            <div className="px-4 py-2 flex items-center justify-between text-gray-600">
                <button
                    onClick={() => onLike(post.id)}
                    className={`flex items-center space-x-1 transition-colors ${post.isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                >
                    <HeartIcon isLiked={post.isLiked} />
                    <span>{post.likes}</span>
                </button>
                <button className="flex items-center space-x-1 hover:text-teal-500 transition-colors">
                    <MessageCircleIcon />
                    <span>{post.comments.length}</span>
                </button>
            </div>

            {/* Comment Input */}
            <form onSubmit={submit} className="px-4 pb-3 flex gap-2">
                <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment…"
                    className="flex-1 p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button type="submit" className="px-3 py-1 bg-teal-500 text-white rounded-md text-sm hover:bg-teal-600">
                    Post
                </button>
            </form>

            {/* Comments List */}
            {post.comments.length > 0 && (
                <div className="px-4 pb-3 space-y-2">
                    {post.comments.map((c) => (
                        <div key={c.id} className="flex space-x-2 text-sm">
                            <img src={c.author.avatarUrl} alt={c.author.name} className="w-7 h-7 rounded-full" />
                            <div>
                                <p className="font-medium">{c.author.name}</p>
                                <p className="text-gray-700">{c.text}</p>
                                <p className="text-xs text-gray-500">{c.timestamp}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* --------------------------------------------------------------------
   CreatePost
   -------------------------------------------------------------------- */
const CreatePost: React.FC<{
    onAddPost: (content: string, location: string, imageFile?: File) => void;
}> = ({ onAddPost }) => {
    const [content, setContent] = useState('');
    const [location, setLocation] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            onAddPost(content.trim(), location, imageFile || undefined);
            setContent('');
            setLocation('');
            setImageFile(null);
            setPreview(null);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
            <form onSubmit={submit} className="space-y-3">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                    placeholder="Share your latest adventure…"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                />
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location (optional)"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                />
                <div>
                    <label htmlFor="img" className="cursor-pointer text-sm text-teal-600">
                        Add photo
                    </label>
                    <input id="img" type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </div>
                {preview && <img src={preview} alt="preview" className="max-h-48 rounded-lg" />}
                <div className="flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600">
                        Post
                    </button>
                </div>
            </form>
        </div>
    );
};

/* --------------------------------------------------------------------
   FeedPage – OPTIMISTIC + REAL-TIME
   -------------------------------------------------------------------- */
const FeedPage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    /* ---------- Load user + initial feed ---------- */
    const loadFeed = useCallback(async () => {
        const userId = await getCurrentUserId();
        setCurrentUserId(userId);

        const { data, error } = await supabase
            .from('posts')
            .select(`
        id, user_id, content, image_url, location, created_at,
        likes!left (id, user_id),
        comments!left (id, user_id, text, created_at)
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            return;
        }

        const transformed: Post[] = data.map((p: any) => {
            const isLiked = userId ? p.likes.some((l: any) => l.user_id === userId) : false;

            return {
                id: String(p.id),
                author: {
                    name: p.user_id === userId ? 'You' : 'Traveler',
                    avatarUrl: 'https://picsum.photos/seed/user/200/200',
                },
                content: p.content,
                imageUrl: p.image_url ?? undefined,
                location: p.location ?? undefined,
                timestamp: formatTimeAgo(p.created_at),
                likes: p.likes.length,
                isLiked,
                comments: p.comments.map((c: any) => ({
                    id: String(c.id),
                    author: {
                        name: c.user_id === userId ? 'You' : 'Traveler',
                        avatarUrl: 'https://picsum.photos/seed/user/200/200',
                    },
                    text: c.text,
                    timestamp: formatTimeAgo(c.created_at),
                })),
            };
        });

        setPosts(transformed);
    }, []);

    useEffect(() => {
        loadFeed();

        // Real-time: refresh on any change
        const channels = [
            supabase.channel('posts').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, loadFeed),
            supabase.channel('likes').on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, loadFeed),
            supabase.channel('comments').on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, loadFeed),
        ].map((ch) => ch.subscribe());

        return () => {
            channels.forEach((ch) => supabase.removeChannel(ch));
        };
    }, [loadFeed]);

    /* ---------- CREATE POST – OPTIMISTIC ---------- */
    const handleAddPost = async (content: string, location: string, imageFile?: File) => {
        if (!currentUserId) return alert('Log in to post');

        const tempId = `temp-${Date.now()}`;
        const previewUrl = imageFile ? URL.createObjectURL(imageFile) : undefined;

        // Optimistic UI (show preview)
        const optimisticPost: Post = {
            id: tempId,
            author: { name: 'You', avatarUrl: 'https://picsum.photos/seed/user/200/200' },
            content,
            imageUrl: previewUrl,
            location: location || undefined,
            timestamp: 'Just now',
            likes: 0,
            isLiked: false,
            comments: [],
        };
        setPosts((prev) => [optimisticPost, ...prev]);

        let finalImageUrl: string | null = null;

        // ---- 1. Upload image (if any) ----
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop()?.toLowerCase();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${currentUserId}/${fileName}`;  // user-specific folder

            const { data, error } = await supabase.storage
                .from('post-images')
                .upload(filePath, imageFile);

            if (error) {
                console.error('Upload error:', error);
                alert('Failed to upload image');
                setPosts(prev => prev.filter(p => p.id !== tempId));
                return;
            }

            const { data: urlData } = supabase.storage
                .from('post-images')
                .getPublicUrl(filePath);

            finalImageUrl = urlData.publicUrl;
        }

        // ---- 2. Insert post with real image URL ----
        const { data: postData, error: postError } = await supabase
            .from('posts')
            .insert({
                user_id: currentUserId,
                content,
                image_url: finalImageUrl,
                location: location || null,
            })
            .select('id, created_at')
            .single();

        if (postError || !postData) {
            alert('Failed to post');
            setPosts((prev) => prev.filter((p) => p.id !== tempId));
            return;
        }

        // ---- 3. Replace temp post with real one ----
        const realPost: Post = {
            ...optimisticPost,
            id: String(postData.id),
            imageUrl: finalImageUrl ?? undefined,
            timestamp: formatTimeAgo(postData.created_at),
        };

        setPosts((prev) => prev.map((p) => (p.id === tempId ? realPost : p)));
    };

    /* ---------- LIKE – OPTIMISTIC ---------- */
    const handleLike = async (postId: string) => {
        if (!currentUserId) return alert('Log in to like');

        const post = posts.find((p) => p.id === postId);
        if (!post) return;

        const wasLiked = post.isLiked ?? false;

        // Optimistic
        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId
                    ? { ...p, isLiked: !wasLiked, likes: wasLiked ? p.likes - 1 : p.likes + 1 }
                    : p
            )
        );

        if (wasLiked) {
            await supabase.from('likes').delete().eq('post_id', Number(postId)).eq('user_id', currentUserId);
        } else {
            await supabase.from('likes').insert({ post_id: Number(postId), user_id: currentUserId });
        }
    };

    /* ---------- COMMENT – OPTIMISTIC ---------- */
    const handleComment = async (postId: string, text: string) => {
        if (!currentUserId) return alert('Log in to comment');

        const tempId = `temp-c-${Date.now()}`;
        const newComment: Comment = {
            id: tempId,
            author: { name: 'You', avatarUrl: 'https://picsum.photos/seed/user/200/200' },
            text,
            timestamp: 'Just now',
        };

        // Optimistic
        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId
                    ? { ...p, comments: [...p.comments, newComment] }
                    : p
            )
        );

        const { error } = await supabase.from('comments').insert({
            post_id: Number(postId),
            user_id: currentUserId,
            text,
        });

        if (error) {
            alert('Failed to comment');
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === postId
                        ? { ...p, comments: p.comments.filter((c) => c.id !== tempId) }
                        : p
                )
            );
        }
        // Real-time will replace temp comment
    };

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto max-w-2xl px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Social Feed</h1>
                <div className="space-y-6">
                    <CreatePost onAddPost={handleAddPost} />
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} onLike={handleLike} onComment={handleComment} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeedPage;