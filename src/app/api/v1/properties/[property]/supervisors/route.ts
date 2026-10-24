import { z } from "zod";
import { db } from "@/server/db";
import { apiError, apiSession, isApiError, jsonData } from "@/server/api/v1";

export async function POST(request:Request,{params}:{params:Promise<{property:string}>}){
  const session=await apiSession(["PLATFORM_ADMIN","LANDLORD","PROPERTY_ADMIN"]);if(isApiError(session))return session;
  const {property:id}=await params;
  const property=await db.property.findFirst({where:{id,...(session.role!=="PLATFORM_ADMIN"&&session.organizationId?{organizationId:session.organizationId}:{})}});if(!property)return jsonData({message:"Not found"},{status:404});
  try{const {userId,active}=z.object({userId:z.string().min(1),active:z.boolean().default(true)}).parse(await request.json());const user=await db.user.findUnique({where:{id:userId}});if(!user||user.role!=="SUPERVISOR")return jsonData({message:"Supervisor user not found"},{status:422});const assignment=await db.supervisorAssignment.upsert({where:{userId_propertyId:{userId,propertyId:id}},create:{userId,propertyId:id,active},update:{active,endsAt:active?null:new Date()}});await db.auditLog.create({data:{organizationId:property.organizationId,actorId:session.userId,action:"supervisor.assignment_updated",resourceType:"SupervisorAssignment",resourceId:assignment.id,metadata:{propertyId:id,userId,active}}});return jsonData({data:assignment},{status:201});}catch(error){return apiError(error);}
}
