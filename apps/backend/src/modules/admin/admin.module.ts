import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService }    from './admin.service';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { MemePost, MemePostSchema } from '../../database/schemas/meme-post.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name,     schema: UserSchema },
      { name: MemePost.name, schema: MemePostSchema },
    ]),
  ],
  controllers: [AdminController],
  providers:   [AdminService],
})
export class AdminModule {}
