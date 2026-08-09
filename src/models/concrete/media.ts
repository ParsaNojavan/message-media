import { Document, Types } from "mongoose"
import IEntity from "@app/contracts/models/abstract/iEntity"
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import * as bcrypt from 'bcrypt'

@Schema({ timestamps: true })
export default class Media extends Document implements IEntity {
    @Prop({ required: true })
    originalName: string;
    @Prop({ required: true, unique: true })
    fileName: string;
    @Prop({ required: true })
    mimeType: string
    @Prop({ required: true })
    size: number
    @Prop({ required: true })
    url: string
    @Prop({ required: true })
    uploadedBy: Types.ObjectId
}

export type MediaDocument = Media & Document & {
    createdAt: Date;
    updatedAt: Date;
};

export const MediaSchema = SchemaFactory.createForClass(Media);
