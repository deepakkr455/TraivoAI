import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { supabase } from '../../AgentAffiliate/services/supabaseService';
import { useAuth } from '../../../hooks/useAuth';
import { BookOpen, Calendar, ArrowRight, Tag, Search, X, ThumbsUp } from 'lucide-react';

interface BlogSummary {
    id: string;
    trip_id: string;
    title: string;
    hero_image_url: string;
    created_at: string;
    tags: string[];
    user_id: string;
    status: string;
    likes_count: number;
    shares_count: number;
}

const MyBlogsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState<BlogSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchBlogs = async () => {
            setLoading(true);
            try {
                // Fetch all published blogs for the public feed
                let query = supabase
                    .from('blogs')
                    .select('id, trip_id, title, hero_image_url, created_at, tags, user_id, status, likes_count, shares_count')
                    .eq('status', 'published')
                    .order('created_at', { ascending: false });

                const { data, error } = await query;

                if (error) throw error;
                if (data) setBlogs(data);
            } catch (error) {
                console.error("Error loading blogs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, [user]);

    const filteredBlogs = blogs.filter(blog =>
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Header showBackground={true} />

            <main className="flex-1 container mx-auto px-4 py-12">
                <div className="flex flex-col items-center justify-center mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                        Travel <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-slate-600">Journals</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                        Explore stories and adventures from travelers around the world.
                    </p>

                    {/* Centered Search Bar */}
                    <div className="w-full max-w-xl relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search stories by title or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-[2rem] leading-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-lg shadow-sm hover:shadow-md transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl p-12 shadow-sm border border-gray-100 max-w-2xl mx-auto">
                        <div className="bg-indigo-50 p-6 rounded-full mb-6">
                            <BookOpen className="w-12 h-12 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Stories Yet</h2>
                        <p className="text-gray-500 mb-8">
                            You haven't generated any blog posts yet. Go to <span className="font-bold text-gray-800">My Trips</span>, select a trip, and click "AI Travel Blog" to create one!
                        </p>
                        <button
                            onClick={() => navigate('/user/my-trips')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                        >
                            Go to My Trips
                        </button>
                    </div>
                ) : filteredBlogs.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 max-w-2xl mx-auto">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No journals match your search</h3>
                        <p className="text-gray-500">Try searching for different destinations or themes.</p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-6 text-indigo-600 font-bold hover:underline"
                        >
                            Clear search
                        </button>
                    </div>
                ) : (
                    <div className='max-w-6xl mx-auto px-6 md:px-12 pb-24'>
                        {/* Recent Stories - Top 5 */}
                        <div className="space-y-20">
                            {filteredBlogs.slice(0, 5).map((blog, index) => {
                                const isEven = index % 2 === 0;
                                return (
                                    <div
                                        key={blog.id}
                                        onClick={() => navigate(`/user/blog/${blog.trip_id}`)}
                                        className={`group relative flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 cursor-pointer transition-all duration-700 hover:-translate-y-2`}
                                    >
                                        {/* Image Section */}
                                        <div className="w-full lg:w-3/5 aspect-[16/10] overflow-hidden rounded-[2.5rem] shadow-xl group-hover:shadow-2xl group-hover:shadow-indigo-500/20 transition-all duration-700">
                                            <img
                                                src={blog.hero_image_url}
                                                alt={blog.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                            />
                                            <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/5 transition-colors duration-700" />
                                        </div>

                                        {/* Content Section */}
                                        <div className="w-full lg:w-2/5 flex flex-col">
                                            <div className="flex items-center gap-4 mb-6">
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
                                                    Latest Issue
                                                </span>
                                                <div className="h-px w-12 bg-gray-200" />
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                                                    {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>

                                            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-[1.1] group-hover:text-indigo-600 transition-colors duration-500">
                                                {blog.title}
                                            </h2>

                                            {blog.tags && (
                                                <div className="flex flex-wrap gap-2 mb-8">
                                                    {blog.tags.slice(0, 3).map(tag => (
                                                        <span key={tag} className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-6 group/btn">
                                                <div className="flex items-center text-indigo-600 font-black text-sm uppercase tracking-[0.2em] border-b-2 border-indigo-600/0 group-hover/btn:border-indigo-600 transition-all pb-1">
                                                    Explore Story
                                                    <ArrowRight className="ml-3 w-5 h-5 group-hover/btn:translate-x-2 transition-transform duration-500" />
                                                </div>

                                                {blog.likes_count > 0 && (
                                                    <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
                                                        <ThumbsUp className="w-3.5 h-3.5 text-indigo-500" />
                                                        {blog.likes_count}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Floating decorative number for desktop */}
                                        <span className={`hidden lg:block absolute -z-10 text-[12rem] font-black text-gray-100/50 select-none transition-all duration-1000 group-hover:text-indigo-50 group-hover:scale-110 ${isEven ? '-left-16 -top-16' : '-right-16 -top-16'}`}>
                                            0{index + 1}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Archive Splitter */}
                        {filteredBlogs.length > 5 && (
                            <div className="my-20 flex flex-col items-center">
                                <div className="h-20 w-px bg-gradient-to-b from-transparent to-gray-200 mb-8" />
                                <h3 className="text-sm font-black uppercase tracking-[0.5em] text-gray-400 mb-4">Story Archive</h3>
                                <div className="h-px w-32 bg-gray-200" />
                            </div>
                        )}

                        {/* Archive Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                            {filteredBlogs.slice(5).map((blog) => (
                                <div
                                    key={blog.id}
                                    onClick={() => navigate(`/user/blog/${blog.trip_id}`)}
                                    className="group cursor-pointer flex flex-col transition-all duration-500 hover:-translate-y-2"
                                >
                                    <div className="aspect-[4/3] overflow-hidden rounded-3xl mb-6 shadow-lg group-hover:shadow-xl transition-all duration-500">
                                        <img
                                            src={blog.hero_image_url}
                                            alt={blog.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Archive</span>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                            {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-black text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                        {blog.title}
                                    </h4>
                                    <div className="flex items-center text-indigo-600 font-bold text-xs uppercase tracking-widest mt-auto">
                                        Read Story
                                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyBlogsPage;
