export interface PostViewRecord {
  ipAddress: string | null;
  visitorId: string | null;
  userAgent: string | null;
  viewedAt: string;
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
  records: PostViewRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
