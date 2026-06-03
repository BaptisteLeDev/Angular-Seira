import { apiRequest } from './client';
import { iriToId } from '@src/utils/iri';
import { VideoSchema, type Video } from '@src/schemas/video.schema';

export const VideoApi = {
  async getByIris(iris: string[]): Promise<Video[]> {
    const ids = iris.map(iriToId).filter((id): id is number => id != null);
    if (ids.length === 0) return [];
    return Promise.all(
      ids.map(async (id) => {
        const raw = await apiRequest<unknown>(`/videos/${id}`);
        return VideoSchema.parse(raw);
      }),
    );
  },
};
