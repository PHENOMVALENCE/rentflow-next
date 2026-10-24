import { redirect } from "next/navigation";

export default function SafetyIndex() {
  redirect("/app/notices");
}
