import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Rate limit configuration (in-memory cache)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS = {
  create_post: { max: 5, window: 600000 }, // 5 per 10 min
  update_post: { max: 10, window: 600000 },
  delete_post: { max: 5, window: 600000 },
  comment: { max: 10, window: 600000 },
  like: { max: 60, window: 600000 },
  save: { max: 60, window: 600000 },
  report: { max: 5, window: 600000 },
  reaction: { max: 100, window: 600000 },
};

function checkRateLimit(userId: string, action: keyof typeof RATE_LIMITS): boolean {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const limit = RATE_LIMITS[action];
  
  const record = rateLimits.get(key);
  
  if (!record || now > record.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + limit.window });
    return true;
  }
  
  if (record.count >= limit.max) {
    return false;
  }
  
  record.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create client with service role for bypassing RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Create separate client with user's JWT for authentication check
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data } = await req.json();

    // Check rate limit
    if (!checkRateLimit(user.id, action)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process action
    let result;
    switch (action) {
      case 'create_post':
        result = await createPost(supabaseClient, user.id, data);
        break;
      case 'update_post':
        result = await updatePost(supabaseClient, user.id, data);
        break;
      case 'delete_post':
        result = await deletePost(supabaseClient, user.id, data);
        break;
      case 'like':
        result = await toggleLike(supabaseClient, user.id, data.postId);
        break;
      case 'save':
        result = await toggleSave(supabaseClient, user.id, data.postId);
        break;
      case 'comment':
        result = await createComment(supabaseClient, user.id, data);
        break;
      case 'report':
        result = await reportPost(supabaseClient, user.id, data);
        break;
      case 'reaction':
        result = await toggleReaction(supabaseClient, user.id, data);
        break;
      case 'pin':
        result = await pinPost(supabaseClient, user.id, data);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createPost(supabase: any, userId: string, data: any) {
  const { content, mediaUrl, mediaType, thumbnailUrl, tags } = data;
  
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({ author_id: userId, content })
    .select()
    .single();
    
  if (postError) throw postError;
  
  if (mediaUrl) {
    await supabase.from('post_media').insert({
      post_id: post.id,
      media_type: mediaType,
      media_url: mediaUrl,
      thumbnail_url: thumbnailUrl,
    });
  }
  
  if (tags && tags.length > 0) {
    for (const tagName of tags) {
      const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      
      let { data: tag } = await supabase
        .from('tags')
        .select('id')
        .eq('slug', tagSlug)
        .single();
        
      if (!tag) {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({ 
            name: tagName.toLowerCase(),
            slug: tagSlug
          })
          .select()
          .single();
        tag = newTag;
      }
      
      if (tag) {
        await supabase.from('post_tags').insert({
          post_id: post.id,
          tag_id: tag.id,
        });
      }
    }
  }
  
  return { success: true, postId: post.id };
}

async function updatePost(supabase: any, userId: string, data: any) {
  const { postId, content, tags, mediaUrl, mediaType, removeMedia } = data;
  
  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();
    
  if (!post || post.author_id !== userId) {
    throw new Error('Unauthorized: You can only edit your own posts');
  }
  
  const { error: updateError } = await supabase
    .from('posts')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', postId);
    
  if (updateError) throw updateError;
  
  // Handle media changes
  if (removeMedia) {
    await supabase.from('post_media').delete().eq('post_id', postId);
  } else if (mediaUrl) {
    await supabase.from('post_media').delete().eq('post_id', postId);
    await supabase.from('post_media').insert({
      post_id: postId,
      media_url: mediaUrl,
      media_type: mediaType,
    });
  }
    
  if (tags) {
    await supabase.from('post_tags').delete().eq('post_id', postId);
    
    for (const tagName of tags) {
      const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      
      let { data: tag } = await supabase
        .from('tags')
        .select('id')
        .eq('slug', tagSlug)
        .single();
      
      if (!tag) {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({ 
            name: tagName.toLowerCase(),
            slug: tagSlug
          })
          .select()
          .single();
        tag = newTag;
      }
      
      if (tag) {
        await supabase.from('post_tags').insert({
          post_id: postId,
          tag_id: tag.id,
        });
      }
    }
  }
  
  return { success: true };
}

async function deletePost(supabase: any, userId: string, data: any) {
  const { postId } = data;
  
  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();
    
  if (!post || post.author_id !== userId) {
    throw new Error('Unauthorized: You can only delete your own posts');
  }
  
  const { error } = await supabase
    .from('posts')
    .update({ is_deleted: true })
    .eq('id', postId);
    
  if (error) throw error;
    
  return { success: true };
}

async function toggleLike(supabase: any, userId: string, postId: string) {
  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();
    
  if (existing) {
    await supabase.from('post_likes').delete().eq('id', existing.id);
    return { success: true, liked: false };
  } else {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    return { success: true, liked: true };
  }
}

async function toggleSave(supabase: any, userId: string, postId: string) {
  const { data: existing } = await supabase
    .from('post_saves')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();
    
  if (existing) {
    await supabase.from('post_saves').delete().eq('id', existing.id);
    return { success: true, saved: false };
  } else {
    await supabase.from('post_saves').insert({ post_id: postId, user_id: userId });
    return { success: true, saved: true };
  }
}

async function createComment(supabase: any, userId: string, data: any) {
  const { postId, content, parentId } = data;
  
  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: userId,
      content,
      parent_id: parentId || null,
    })
    .select()
    .single();
    
  if (error) throw error;
  
  return { success: true, commentId: comment.id };
}

async function reportPost(supabase: any, userId: string, data: any) {
  const { postId, reason, details } = data;
  
  const { error } = await supabase
    .from('post_reports')
    .insert({
      post_id: postId,
      reporter_id: userId,
      reason,
      details,
    });
    
  if (error) throw error;
  
  return { success: true, message: 'მადლობა, მოდერატორი განიხილავს შეტყობინებას' };
}

async function toggleReaction(supabase: any, userId: string, data: any) {
  const { postId, reactionType } = data;
  
  const validReactions = ['like', 'funny', 'fire', 'helpful'];
  if (!validReactions.includes(reactionType)) {
    throw new Error('Invalid reaction type');
  }
  
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType)
    .single();
    
  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id);
    return { success: true, reacted: false };
  } else {
    await supabase.from('reactions').insert({ 
      post_id: postId, 
      user_id: userId,
      reaction_type: reactionType
    });
    return { success: true, reacted: true };
  }
}

async function pinPost(supabaseClient: any, userId: string, data: any) {
  const { postId, isPinned } = data;

  const { error } = await supabaseClient
    .from('posts')
    .update({ 
      is_pinned: isPinned,
      pinned_at: isPinned ? new Date().toISOString() : null,
      pinned_by: isPinned ? userId : null
    })
    .eq('id', postId);

  if (error) throw error;
  return { success: true };
}
