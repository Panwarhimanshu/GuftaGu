import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MemeFeedController } from './meme-feed.controller';
import { MemeFeedService }    from './meme-feed.service';
import { MemePost, MemePostSchema } from '../../database/schemas/meme-post.schema';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MemePost.name, schema: MemePostSchema }]),
    StorageModule,
  ],
  controllers: [MemeFeedController],
  providers:   [MemeFeedService],
})
export class MemeFeedModule {}
