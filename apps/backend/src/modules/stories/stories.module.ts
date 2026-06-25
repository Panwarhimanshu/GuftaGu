import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoriesController } from './stories.controller';
import { StoriesService }    from './stories.service';
import { Story, StorySchema } from '../../database/schemas/story.schema';
import { User, UserSchema }   from '../../database/schemas/user.schema';
import { StorageModule }      from '../storage/storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Story.name, schema: StorySchema },
      { name: User.name,  schema: UserSchema },
    ]),
    StorageModule,
  ],
  controllers: [StoriesController],
  providers:   [StoriesService],
  exports:     [StoriesService],
})
export class StoriesModule {}
