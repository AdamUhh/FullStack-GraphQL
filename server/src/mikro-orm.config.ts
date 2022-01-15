import { User } from './entities/User';
import { __prod__ } from './constants';
import { Post } from './entities/Post';
import { MikroORM } from '@mikro-orm/core';
import path from 'path';

export default {
    // migrations is the process of migrating data
    // from one or more source databases to one or more target databases
    migrations: {
        // Makes sure we are using the right path (an absolute path) to ensure no errors can occur
        path: path.join(__dirname, './migrations'), // path to the folder with migrations
        pattern: /^[\w-]+\d+\.[tj]s$/, // regex pattern for the migration files
        // The above pattern is changed to allow for both ts and js
        // pattern: /^[\w-]+\d+\.ts$/, //  (original pattern) regex pattern for the migration files
    },
    dbName: 'lireddit',
    user: 'postgres',
    password: 'postgresdocker',
    type: 'postgresql',
    entities: [Post, User],
    debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];
// MikroORM.init is the function,
// and we are getting the type of the function;
// Parameters returns an array (of the type of MikroORM),
// so we get the first parameters
