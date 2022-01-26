import DataLoader from "dataloader";
import { User } from "../entities/User";

// userIds will be an array of numbers: [1, 78, 5, 56]
// and will return the User:
// [{id:1, username:'...'},{id:78, username:'...'},{id:5, username:'...'},{id:56, username:'...'}]
export const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    // to make 1 sql query to get all the users
    const users = await User.findByIds(userIds as number[]);
    const userIdToUser: Record<number, User> = {};
    users.forEach((u) => {
      userIdToUser[u.id] = u;
    });

    // for every userId, we are going to grab the user from our map
    return userIds.map((userId) => userIdToUser[userId]);
  });
