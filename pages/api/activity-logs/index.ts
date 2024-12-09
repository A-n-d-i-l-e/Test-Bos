import type { NextApiRequest, NextApiResponse } from "next";

const activityLogs = [
  { id: "1", userId: "user_1", activity: "Logged in", timestamp: "2024-12-08 10:00 AM" },
  { id: "2", userId: "user_1", activity: "Updated profile", timestamp: "2024-12-08 11:00 AM" },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  const logs = activityLogs.filter((log) => log.userId === userId);
  res.status(200).json(logs);
}