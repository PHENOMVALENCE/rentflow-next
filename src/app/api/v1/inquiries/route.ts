import { db } from "@/server/db";
import { apiSession, isApiError, jsonData } from "@/server/api/v1";

export async function GET(){const s=await apiSession(["PLATFORM_ADMIN","LANDLORD","PROPERTY_ADMIN"]);if(isApiError(s))return s;const where=s.role!=="PLATFORM_ADMIN"&&s.organizationId?{listing:{unit:{property:{organizationId:s.organizationId}}}}:{};return jsonData({data:await db.propertyInquiry.findMany({where,include:{},orderBy:{createdAt:"desc"}})});}
