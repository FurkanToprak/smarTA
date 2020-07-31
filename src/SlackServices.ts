/* eslint-disable @typescript-eslint/camelcase */
import dotenv from 'dotenv';
dotenv.config();
export const slackToken: string = process.env.SLACK_OAUTH_TOKEN || '';
export const slackSigningSecret: string =
  process.env.SLACK_SIGNING_SECRET || '';

/** Things smarta says. */
export enum BotPrompts {
  Introduction = "\
  Hello! Thank you for installing smarTA. I'm powered by AI. My only purpose in life is to help students learn. Here's how you teach me:\n\n\
  *1)* Upload the course textbook in pdf format. Make sure you rename it `textbook.pdf` before uploading, so I know what it is.\n\n\
  *2)* Upload the course syllabus in pdf format. Make sure you rename it `syllabus.pdf` before uploading, so I know what it is.\n\n\
  *Note:* Slack only allows for files less than _1 GB_. Please be aware of this limitation.\n\n\
  *Copyright notice:* Please make sure that you have appropriate permissions to distribute excerpts from the textbook internally. smarTA is not liable for any copyright violations or intellectual property (IP) infringements.",
}

/**
 * @
 * @example
 * {
 *   type: 'app_home_opened',
 *  user: 'UT3C2MUTT',
 *  channel: 'D01201FNR5Y',
 *  tab: 'messages',
 *  event_ts: '1595384414.230458'
 * }
 */
export interface AppHomeOpened {
  type: string;
  user: string;
  channel: string;
  tab: string;
  event_ts: string;
}

/** Message to Smarta Slackbot from User.
 * @example:
{ 
  client_msg_id: 'd96da574-7ec9-4bc1-9f33-3af779bbfe18',
  type: 'message',
  text: 'dffdf',
  user: 'UT3C2MUTT',
  ts: '1595387323.000200',
  team: 'TTDGX22G0',
  blocks: [ { type: 'rich_text', block_id: 'hGuwj', elements: [Array] } ],
  channel: 'D01201FNR5Y',
  event_ts: '1595387323.000200',
  channel_type: 'im'
}
*/
export interface IncomingMessage {
  client_msg_id: string;
  type: string;
  text: string;
  user: string;
  ts: string;
  team: string;
  blocks: { type: string; block_id: string[]; elements: string[] }[];
  channel: string;
  event_ts: string;
  channel_type: string;
  /** Below lies attributes populated when files are shared. */
  files?: {
    string: string;
  }[];
  upload?: boolean;
  display_as_bot?: boolean;
  subtype?: 'file_share' | string;
}

/** Slack WebClient API User response.
 * @example
 * {
    "ok": true,
    "profile": {
        "title": string;
        "phone": string;
        "skype": string;
        "real_name": "smartastring;
        "real_name_normalized": "smartastring;
        "display_name": string;
        "display_name_normalized": string;
        "fields": null,
        "status_text": string;
        "status_emoji": string;
        "status_expiration": 0,
        "avatar_hash": "g48b6150cd67string;
        "api_app_id": "A012079A1EFstring;
        "always_active": false,
        "bot_id": "B011K9AHJR5string;
        "image_24": "https:\/\/secure.gravatar.com\/avatar\/48b6150cd67156019cce7cb40a13a3ca.jpg?s=24&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0006-24.pngstring;
        "image_32": "https:\/\/secure.gravatar.com\/avatar\/48b6150cd67156019cce7cb40a13a3ca.jpg?s=32&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0006-32.pngstring;
        "image_48": "https:\/\/secure.gravatar.com\/avatar\/48b6150cd67156019cce7cb40a13a3ca.jpg?s=48&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0006-48.pngstring;
        "image_72": "https:\/\/secure.gravatar.com\/avatar\/48b6150cd67156019cce7cb40a13a3ca.jpg?s=72&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0006-72.pngstring;
        "image_192": "https:\/\/secure.gravatar.com\/avatar\/48b6150cd67156019cce7cb40a13a3ca.jpg?s=192&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0006-192.pngstring;
        "image_512": "https:\/\/secure.gravatar.com\/avatar\/48b6150cd67156019cce7cb40a13a3ca.jpg?s=512&d=https%3A%2F%2Fa.slack-edge.com%2Fdf10d%2Fimg%2Favatars%2Fava_0006-512.pngstring;
        "status_text_canonical": ""
    }
}

 */
export interface SlackUser {
  title: string;
  phone: string;
  skype: string;
  real_name: string;
  real_name_normalized: string;
  display_name: string;
  display_name_normalized: string;
  fields: any;
  status_text: string;
  status_emoji: string;
  status_expiration: number;
  avatar_hash: string;
  api_app_id: string;
  always_active: false;
  bot_id: string;
  image_24: string;
  image_32: string;
  image_48: string;
  image_72: string;
  image_192: string;
  image_512: string;
  status_text_canonical: string;
}
