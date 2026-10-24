import { redirect } from "next/navigation";
export default async function OperationalDocumentFile({params}:{params:Promise<{id:string}>}){const {id}=await params;redirect(`/api/operational-documents/${id}/download`);}
