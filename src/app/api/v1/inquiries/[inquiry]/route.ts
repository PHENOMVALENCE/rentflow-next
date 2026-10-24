import { z } from "zod";
import { db } from "@/server/db";
import { apiError, apiSession, isApiError, jsonData } from "@/server/api/v1";

export async function PATCH(request:Request,{params}:{params:Promise<{inquiry:string}>}){const s=await apiSession(["PLATFORM_ADMIN","LANDLORD","PROPERTY_ADMIN"]);if(isApiError(s))return s;const {inquiry:id}=await params;const row=await db.propertyInquiry.findFirst({where:{id,...(s.role!=="PLATFORM_ADMIN"&&s.organizationId?{listing:{unit:{property:{organizationId:s.organizationId}}}}:{})}});if(!row)return jsonData({message:"Not found"},{status:404});try{const input=z.object({status:z.enum(["NEW","CONTACTED","QUALIFIED","CLOSED"])}).parse(await request.json());const updated=await db.propertyInquiry.update({where:{id},data:input});return jsonData({data:updated});}catch(error){return apiError(error);}}
