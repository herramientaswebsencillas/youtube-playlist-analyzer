/**
 * Tipos que describen (parcialmente) las respuestas crudas de la
 * YouTube Data API v3. Sólo se modelan los campos que la app consume.
 * Referencia: https://developers.google.com/youtube/v3/docs
 */

export interface YtThumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface YtThumbnails {
  default?: YtThumbnail;
  medium?: YtThumbnail;
  high?: YtThumbnail;
  standard?: YtThumbnail;
  maxres?: YtThumbnail;
}

export interface YtPageInfo {
  totalResults: number;
  resultsPerPage: number;
}

export interface YtErrorDetail {
  domain?: string;
  reason?: string;
  message?: string;
}

export interface YtErrorBody {
  error?: {
    code?: number;
    message?: string;
    errors?: YtErrorDetail[];
  };
}

/* ---- playlists.list ---- */

export interface YtPlaylistSnippet {
  title?: string;
  channelTitle?: string;
  thumbnails?: YtThumbnails;
}

export interface YtPlaylistContentDetails {
  itemCount?: number;
}

export interface YtPlaylist {
  id: string;
  snippet?: YtPlaylistSnippet;
  contentDetails?: YtPlaylistContentDetails;
}

export interface YtPlaylistListResponse extends YtErrorBody {
  items?: YtPlaylist[];
  pageInfo?: YtPageInfo;
}

/* ---- playlistItems.list ---- */

export interface YtResourceId {
  kind?: string;
  videoId?: string;
}

export interface YtPlaylistItemSnippet {
  title?: string;
  videoOwnerChannelTitle?: string;
  position?: number;
  resourceId?: YtResourceId;
  thumbnails?: YtThumbnails;
}

export interface YtPlaylistItemContentDetails {
  videoId?: string;
  /** Ausente cuando el video no está disponible. */
  videoPublishedAt?: string;
}

export interface YtPlaylistItemStatus {
  privacyStatus?: string;
}

export interface YtPlaylistItem {
  id: string;
  snippet?: YtPlaylistItemSnippet;
  contentDetails?: YtPlaylistItemContentDetails;
  status?: YtPlaylistItemStatus;
}

export interface YtPlaylistItemsResponse extends YtErrorBody {
  items?: YtPlaylistItem[];
  nextPageToken?: string;
  pageInfo?: YtPageInfo;
}

/* ---- videos.list ---- */

export interface YtVideoStatus {
  uploadStatus?: string;
  privacyStatus?: string;
}

export interface YtRegionRestriction {
  blocked?: string[];
  allowed?: string[];
}

export interface YtVideoContentDetails {
  regionRestriction?: YtRegionRestriction;
}

export interface YtVideo {
  id: string;
  status?: YtVideoStatus;
  contentDetails?: YtVideoContentDetails;
}

export interface YtVideosResponse extends YtErrorBody {
  items?: YtVideo[];
}
