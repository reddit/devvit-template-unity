export type InitResponse = {
  type: "init";
  postId: string;
  username: string;
  snoovatarUrl: string;
  previousTime: string; // empty string if no previous time exists
};

export type LevelCompletedRequest = {
  type: "level-completed";
  username: string;
  postId: string;
  time: string;
};

export type LevelCompletedResponse = {
  type: "level-completed";
  success: boolean;
  message?: string;
};

