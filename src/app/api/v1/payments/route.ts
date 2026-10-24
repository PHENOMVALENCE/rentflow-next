import { db } from "@/server/db";
import { apiSession, isApiError, jsonData } from "@/server/api/v1";

export async function GET(){const s=await apiSession();if(isApiError(s))return s;const where=s.role==="TENANT"?{lease:{tenant:{userId:s.userId}}}:s.role==="SUPERVISOR"?{lease:{unit:{property:{supervisorAssignments:{some:{userId:s.userId,active:true}}}}}}:s.role!=="PLATFORM_ADMIN"&&s.organizationId?{lease:{unit:{property:{organizationId:s.organizationId}}}}:{};return jsonData({data:await db.paymentObligation.findMany({where,include:{lease:{include:{tenant:true,unit:{include:{property:true}}}},receipt:true,transactions:{orderBy:{createdAt:"desc"}}},orderBy:{createdAt:"desc"}})});}
