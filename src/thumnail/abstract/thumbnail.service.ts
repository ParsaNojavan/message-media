export default abstract class ThumbnailService {
  abstract generateVideoThumb(videoPath: string, width: number, atSecond: number): Promise<string>
  abstract generateImageThumb(imagePath: string, width: number, quality: number): Promise<string>
}
