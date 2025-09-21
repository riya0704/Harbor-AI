
'use server';

import type { Post, SocialPlatform } from './types';
import SocialAccount from '@/models/SocialAccount';
import PostModel from '@/models/Post';

/**
 * NOTE TO USER:
 * This is a placeholder for the actual social media publishing logic.
 * You will need to replace the console.log statements with API calls
 * to the respective social media platforms using their SDKs (e.g., twitter-api-v2, linkedin-api).
 * 
 * You'll also need to handle fetching the correct user tokens from the SocialAccount model.
 */

async function publishToTwitter(post: Post, account: any) {
  console.log(`--- Publishing to Twitter for user ${account.userId} ---`);
  console.log(`Account: @${account.username}`);
  console.log(`Content: ${post.content}`);
  if (post.image) console.log(`Image: ${post.image.substring(0, 50)}...`);
  if (post.video) console.log(`Video: ${post.video.substring(0, 50)}...`);
  // TODO: Implement Twitter API call here.
  // const { TwitterApi } = require('twitter-api-v2');
  // const client = new TwitterApi(account.accessToken);
  // await client.v2.tweet({ text: post.content });
  console.log("--- Successfully published to Twitter (SIMULATED) ---");
  return { success: true };
}

async function publishToLinkedIn(post: Post, account: any) {
  console.log(`--- Publishing to LinkedIn for user ${account.userId} ---`);
  console.log(`Account: ${account.username}`);
  console.log(`Content: ${post.content}`);
  // TODO: Implement LinkedIn API call here.
  console.log("--- Successfully published to LinkedIn (SIMULATED) ---");
  return { success: true };
}

async function publishToInstagram(post: Post, account: any) {
  console.log(`--- Publishing to Instagram for user ${account.userId} ---`);
  console.log(`Account: @${account.username}`);
  console.log(`Content: ${post.content}`);
  // TODO: Implement Instagram API call here.
  console.log("--- Successfully published to Instagram (SIMULATED) ---");
  return { success: true };
}

const publisherMap: Record<SocialPlatform, (post: Post, account: any) => Promise<{ success: boolean, error?: string }>> = {
  Twitter: publishToTwitter,
  LinkedIn: publishToLinkedIn,
  Instagram: publishToInstagram,
};

export async function publishPost(postId: string): Promise<void> {
  try {
    const post = await PostModel.findById(postId);
    if (!post || post.status !== 'scheduled') {
      console.log(`Post ${postId} not found or not in scheduled state.`);
      return;
    }

    console.log(`Processing post: ${post.id}`);

    const accounts = await SocialAccount.find({
      userId: post.userId,
      platform: { $in: post.platforms },
    });

    if (accounts.length === 0) {
      throw new Error(`No matching social accounts found for user ${post.userId} and platforms ${post.platforms.join(', ')}`);
    }

    const postObject = { ...post.toObject(), id: post._id.toString(), date: post.date };

    const results = await Promise.allSettled(
      post.platforms.map(async (platform) => {
        const account = accounts.find(a => a.platform === platform);
        if (!account) {
          throw new Error(`No account found for platform ${platform}`);
        }
        const publisher = publisherMap[platform as SocialPlatform];
        if (!publisher) {
          throw new Error(`No publisher available for platform: ${platform}`);
        }
        return await publisher(postObject, account.toObject());
      })
    );

    const hasError = results.some(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success));
    
    post.status = hasError ? 'error' : 'published';
    await post.save();

    console.log(`Finished processing post ${post.id}. New status: ${post.status}`);

  } catch (error) {
    console.error(`Failed to publish post ${postId}:`, error);
    const post = await PostModel.findById(postId);
    if (post) {
      post.status = 'error';
      await post.save();
    }
  }
}
