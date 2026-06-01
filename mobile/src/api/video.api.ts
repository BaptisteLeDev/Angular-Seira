import { apiRequest } from './client';
import { iriToId } from '@src/utils/iri';
import { VideoSchema, type Video } from '@src/schemas/video.schema';

export const VideoApi = {
  async getByIris(iris: string[]): Promise<Video[]> {
    if (iris.length === 0) return [];
    return Promise.all(
      iris.map(async (iri) => {
        const raw = await apiRequest<unknown>(`/videos/${iriToId(iri)}`);
        return VideoSchema.parse(raw);
      }),
    );
  },
};
