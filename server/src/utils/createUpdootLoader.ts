import DataLoader from "dataloader";
import { Updoot } from "../entities/Updoot";

// ?? a difference between the UserLoader and UpdootLoader is
// ?? is to load the updoot item, we have to know both the postId and the userId
// we will load: [{postId: 5, userId: 10},{postId: 5, userId: 20}, null}]
// and we will return: [{postId: 5, userId: 10, value: 1},{postId: 5, userId: 20, value: 20}, null}]
export const createUpdootLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Updoot | null>(
    async (keys) => {
      const updoots = await Updoot.findByIds(keys as any);
      const updootIdsToUpdoot: Record<string, Updoot> = {};
      updoots.forEach((updoot) => {
        updootIdsToUpdoot[`${updoot.userId}|${updoot.postId}`] = updoot;
      });

      return keys.map(
        (key) => updootIdsToUpdoot[`${key.userId}|${key.postId}`]
      );
    }
  );
