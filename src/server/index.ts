import express from "express";
import {
  InitResponse,
  LevelCompletedRequest,
  LevelCompletedResponse,
} from "../shared/types/api";
import {
  createServer,
  context,
  getServerPort,
  reddit,
  redis,
} from "@devvit/web/server";
import { createPost } from "./core/post";

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

// Example to show how to send initial data to the Unity Game
router.get<
  { postId: string },
  InitResponse | { status: string; message: string }
>("/api/init", async (_req, res): Promise<void> => {
  const { postId } = context;

  if (!postId) {
    console.error("API Init Error: postId not found in devvit context");
    res.status(400).json({
      status: "error",
      message: "postId is required but missing from context",
    });
    return;
  }

  try {
    const username = await reddit.getCurrentUsername();
    const currentUsername = username ?? "anonymous";
    
    // Fetch user info for snoovatar
    let snoovatarUrl = "";
    if (username && context.userId) {
      const user = await reddit.getUserById(context.userId);
      if (user) {
        snoovatarUrl = (await user.getSnoovatarUrl()) ?? "";
      }
    }
    
    // Fetch previous time from Redis using postId:username as key
    const redisKey = `${postId}:${currentUsername}`;
    const previousTime = await redis.get(redisKey);

    res.json({
      type: "init",
      postId: postId,
      username: currentUsername,
      snoovatarUrl: snoovatarUrl,
      previousTime: previousTime ?? "",
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    let errorMessage = "Unknown error during initialization";
    if (error instanceof Error) {
      errorMessage = `Initialization failed: ${error.message}`;
    }
    res.status(400).json({ status: "error", message: errorMessage });
  }
});

router.post<
  unknown,
  LevelCompletedResponse | { status: string; message: string },
  LevelCompletedRequest
>("/api/level-completed", async (req, res): Promise<void> => {
  const { postId } = context;
  
  if (!postId) {
    console.error("No postId in context");
    res.status(400).json({
      status: "error",
      message: "postId is required",
    });
    return;
  }

  try {
    const { username, time } = req.body;
    
    if (!username || !time) {
      console.error("Missing username or time in request");
      res.status(400).json({
        status: "error",
        message: "username and time are required",
      });
      return;
    }

    // Store the completion time in Redis with key format: postId:username
    const redisKey = `${postId}:${username}`;
    await redis.set(redisKey, time);

    res.json({
      type: "level-completed",
      success: true,
      message: "Time saved successfully",
    });
  } catch (error) {
    console.error(`API Level Completed Error for post ${postId}:`, error);
    let errorMessage = "Unknown error saving completion time";
    if (error instanceof Error) {
      errorMessage = `Failed to save time: ${error.message}`;
    }
    res.status(500).json({
      type: "level-completed",
      success: false,
      message: errorMessage,
    });
  }
});

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();
    post

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

app.use(router);

const server = createServer(app);
server.on("error", (err) => console.error(`server error; ${err.stack}`));
server.listen(getServerPort());
