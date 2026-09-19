import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ObjectDocument = ObjectItem & Document;

@Schema({ timestamps: true })
export class ObjectItem {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ default: () => new Date() })
  createdAt: Date;
}

export const ObjectSchema = SchemaFactory.createForClass(ObjectItem);