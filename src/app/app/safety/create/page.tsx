import { redirect } from "next/navigation";

export default function SafetyCreate() {
  redirect("/app/notices/new");
}
