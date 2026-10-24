import { z } from "zod";
import { db } from "@/server/db";
import { apiError, apiSession, isApiError, jsonData } from "@/server/api/v1";

const schema = z.object({ name:z.string().trim().min(2).max(160).optional(), type:z.enum(["RESIDENTIAL","COMMERCIAL","MIXED_USE"]).optional(), address:z.string().trim().min(3).max(300).optional(), region:z.string().trim().min(2).max(100).optional(), district:z.string().trim().min(2).max(100).optional(), ward:z.string().trim().max(100).nullable().optional(), streetVillage:z.string().trim().max(160).nullable().optional(), active:z.boolean().optional() });

async function scoped(id:string, session:Awaited<ReturnType<typeof apiSession>>) {
  if (isApiError(session)) return null;
  return db.property.findFirst({where:{id,...(session.role!=="PLATFORM_ADMIN"&&session.organizationId?{organizationId:session.organizationId}:{})},include:{buildings:true,units:true,supervisorAssignments:{where:{active:true},include:{user:true}}}});
}
export async function GET(_r:Request,{params}:{params:Promise<{property:string}>}){const s=await apiSession(["PLATFORM_ADMIN","LANDLORD","PROPERTY_ADMIN","SUPERVISOR"]);if(isApiError(s))return s;const {property:id}=await params;const p=await scoped(id,s);if(!p)return jsonData({message:"Not found"},{status:404});if(s.role==="SUPERVISOR"&&!p.supervisorAssignments.some(a=>a.userId===s.userId))return jsonData({message:"Forbidden"},{status:403});return jsonData({data:p});}
export async function PATCH(request:Request,{params}:{params:Promise<{property:string}>}){const s=await apiSession(["PLATFORM_ADMIN","LANDLORD","PROPERTY_ADMIN"]);if(isApiError(s))return s;const {property:id}=await params;const p=await scoped(id,s);if(!p)return jsonData({message:"Not found"},{status:404});try{const input=schema.parse(await request.json());const updated=await db.property.update({where:{id},data:input});await db.auditLog.create({data:{organizationId:p.organizationId,actorId:s.userId,action:"property.updated",resourceType:"Property",resourceId:id,metadata:input}});return jsonData({data:updated});}catch(error){return apiError(error);}}
