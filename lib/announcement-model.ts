export type AnnouncementTextPart =
  | { type: "text"; value: string }
  | { type: "everyone"; value: string }
  | { type: "role"; value: string; color: string | null }
  | { type: "channel"; value: string; url: string };

export interface AnnouncementEmbed {
  titleParts?: AnnouncementTextPart[];
  descriptionParts?: AnnouncementTextPart[];
  url?: string;
  imageUrl?: string;
}

export interface AnnouncementAuthor {
  nickname: string;
  avatarUrl: string;
  roleColor: string | null;
}

export interface Announcement {
  id: string;
  createdAt: string;
  mentionEveryone: boolean;
  discordUrl: string;
  author: AnnouncementAuthor;
  contentParts: AnnouncementTextPart[];
  embeds: AnnouncementEmbed[];
}

function hasEmbedContent(embed: AnnouncementEmbed): boolean {
  return Boolean(
    embed.titleParts?.length ||
      embed.descriptionParts?.length ||
      embed.imageUrl
  );
}

export function announcementHasBody(announcement: Announcement): boolean {
  return (
    announcement.contentParts.length > 0 ||
    announcement.embeds.some(hasEmbedContent)
  );
}
