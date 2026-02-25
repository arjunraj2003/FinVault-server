"use strict";
// import { redisClient } from "../config/redis-connet";
Object.defineProperty(exports, "__esModule", { value: true });
// const MAX_ATTEMPTS:number=5;
// const WINDOW_SECONDS=300;
// export const checkLoginAttempts=async(userId:string)=>{
//     const key=`login:attempts:${userId}`
//     const attempts=Number(await redisClient.incr(key));
//     if(attempts===1){
//         await redisClient.expire(key,WINDOW_SECONDS);
//     }
//     if(attempts>MAX_ATTEMPTS){
//         return {
//             blocked:true,
//             ttl: await redisClient.ttl(key)
//         };
//     }
//     return {
//         blocked:false,
//         remaining:MAX_ATTEMPTS-attempts,
//     };
// };
// export const resetLoginAttempts=async(userId:string)=>{
//     const key=`login:attempts:${userId}`
//     await redisClient.del(key);
// }
//# sourceMappingURL=AuthLimiter.service.js.map