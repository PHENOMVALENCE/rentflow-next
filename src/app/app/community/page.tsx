import Link from "next/link";
import { AppIcon } from "@/components/icons";
import { Empty, PageHeader, Panel, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { getAccessibleCommunities } from "@/server/rentflow/community-read-model";
import { getTranslator } from "@/i18n/server";
import { plural } from "@/i18n/translate";

export const metadata = { title: "Community" };

/** Community rooms the session may see (Laravel `app.community.index`). Scope comes from the read model. */
export default async function CommunityIndexPage() {
  const session = await requireSession();
  const communities = await getAccessibleCommunities(session);
  const { t } = await getTranslator();

  return (
    <>
      <PageHeader
        title={t("Community")}
        description={t("Neighbour rooms for the buildings in your scope. Official safety notices are published separately under Safety.")}
      />
      {communities.length === 0 ? (
        <Empty icon="chat" title={t("No community rooms in your scope yet.")}>
          {t("Rooms appear here once a property has an active community.")}
        </Empty>
      ) : (
        <Panel title={t("Rooms")} subtitle={plural(t, communities.length, "1 room", ":count rooms")} flush>
          <ul className="rf-list">
            {communities.map((community) => (
              <li key={community.id}>
                <Link href={`/app/community/${community.id}`} className="rf-list-row">
                  <span className="rf-list-icon" aria-hidden="true"><AppIcon name="chat" className="h-[18px] w-[18px]" /></span>
                  <span className="rf-list-main">
                    <span className="rf-list-title block">{community.name}</span>
                    <span className="rf-list-meta block">{t(":members members · :messages messages", { members: community.members, messages: community.messages })}</span>
                  </span>
                  <span className="rf-list-aside"><Status tone={community.joined ? "teal" : "neutral"}>{community.joined ? t("Joined") : t("Not joined")}</Status></span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
