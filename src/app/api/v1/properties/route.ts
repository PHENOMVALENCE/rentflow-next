import { z } from "zod";
import { db } from "@/server/db";
import { apiError, apiSession, isApiError, jsonData, orgWhere } from "@/server/api/v1";

const schema = z.object({ organizationId: z.string().optional(), name: z.string().trim().min(2).max(160), type: z.enum(["RESIDENTIAL","COMMERCIAL","MIXED_USE"]), address: z.string().trim().min(3).max(300), region: z.string().trim().min(2).max(100), district: z.string().trim().min(2).max(100), ward: z.string().trim().max(100).optional().nullable(), streetVillage: z.string().trim().max(160).optional().nullable() });

export async function GET() {
  const session = await apiSession(["PLATFORM_ADMIN","LANDLORD","PROPERTY_ADMIN","SUPERVISOR"]); if (isApiError(session)) return session;
  const where = session.role === "SUPERVISOR" ? { supervisorAssignments: { some: { userId: session.userId, active: true } } } : orgWhere(session);
  return jsonData({ data: await db.property.findMany({ where, include: { _count: { select: { units: true } } }, orderBy: { name: "asc" } }) });
}
export async function POST(request: Request) {
  const session = await apiSession(["PLATFORM_ADMIN","LANDLORD","PROPERTY_ADMIN"]); if (isApiError(session)) return session;
  try { const input=schema.parse(await request.json()); const organizationId=session.organizationId ?? input.organizationId; if(!organizationId) return jsonData({message:"Organization required"},{status:422}); const {organizationId:_ignored,...data}=input; const property=await db.property.create({data:{...data,organizationId}}); await db.auditLog.create({data:{organizationId,actorId:session.userId,action:"property.created",resourceType:"Property",resourceId:property.id}}); return jsonData({data:property},{status:201}); } catch(error){return apiError(error);}
}
