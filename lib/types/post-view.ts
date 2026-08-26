export interface PostViewIpEntry {
  ipAddress: string;
  viewCount: number;
  firstSeen: string;
  lastSeen: string;
}

export interface PostViewersData {
  post: {
    id: string;
    title: string;
  };
  summary: {
    uniqueVisitorCount: number;
    uniqueIpCount: number;
    viewRecords: number;
    viewRecordsWithIp: number;
    viewRecordsWithoutIp: number;
  };
  ips: PostViewIpEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
